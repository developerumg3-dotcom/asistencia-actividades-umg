/*
 * Pruebas de la escritura atomica del marcaje (ASI2-20), sin base de datos.
 *
 *     pnpm probar
 *
 * No hay conexion: `drizzle()` con una URL falsa solo arma SQL; nada se ejecuta. Lo que se
 * comprueba es que asistencia y bitacora "ok" viajan en UN solo `batch` (una transaccion), y
 * que el camino de rechazos no usa esa escritura. Que Neon de verdad revierta las dos filas
 * ante un fallo solo se puede ver contra la base (`pnpm probar:base`, la corre Julio).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { drizzle } from "drizzle-orm/neon-http";

import {
  escribirMarcajeOk,
  esViolacionDeUnicidad,
  sentenciasDeMarcajeOk,
} from "../src/lib/qr/escritura.ts";

const base = drizzle("postgresql://usuario:clave@localhost.invalid/prueba");

const datos = {
  ip: "10.0.0.7",
  dispositivoId: "disp-1",
  asistencia: {
    alumnoId: "alumno-1",
    actividadId: "11111111-1111-4111-8111-111111111111",
    marcadaEn: new Date("2026-09-01T15:00:00Z"),
    slot: BigInt(123),
    origen: "qr" as const,
    clasesSnapshot: [] as string[], // sin clases inscritas: igual se guarda
  },
};

test("las dos sentencias son asistencia y bitacora 'ok' del mismo alumno y actividad", () => {
  const [a, b] = sentenciasDeMarcajeOk(base, datos);
  const sqlA = a.toSQL();
  const sqlB = b.toSQL();

  assert.match(sqlA.sql, /^insert into "asistencia"/);
  assert.match(sqlB.sql, /^insert into "bitacora"/);
  assert.ok(sqlB.params.includes("ok"));
  assert.ok(sqlB.params.includes("marcaje"));
  assert.ok(sqlB.params.includes("alumno-1"));
  assert.ok(sqlB.params.includes("11111111-1111-4111-8111-111111111111"));
  assert.ok(sqlB.params.includes("10.0.0.7"));
});

test("escribirMarcajeOk manda las dos sentencias en UN solo batch y nada suelto", async () => {
  const llamadas: { insert: number; batch: number; tamano: number }[] = [];
  let inserts = 0;
  const espia = {
    insert: (...args: Parameters<typeof base.insert>) => {
      inserts++;
      return base.insert(...args);
    },
    batch: async (consultas: readonly unknown[]) => {
      llamadas.push({ insert: inserts, batch: llamadas.length + 1, tamano: consultas.length });
      return [] as never;
    },
  } as unknown as Parameters<typeof escribirMarcajeOk>[0];

  await escribirMarcajeOk(espia, datos);

  assert.equal(llamadas.length, 1);
  assert.equal(llamadas[0].tamano, 2);
});

test("si el batch falla, el error sube sin tragarse: no queda 'ok' suelto", async () => {
  const espia = {
    insert: base.insert.bind(base),
    batch: async () => {
      throw Object.assign(new Error("falla"), { cause: { code: "23505" } });
    },
  } as unknown as Parameters<typeof escribirMarcajeOk>[0];

  await assert.rejects(escribirMarcajeOk(espia, datos), (e) => esViolacionDeUnicidad(e));
});

test("esViolacionDeUnicidad reconoce el 23505 directo o anidado en cause", () => {
  assert.equal(esViolacionDeUnicidad({ code: "23505" }), true);
  assert.equal(esViolacionDeUnicidad({ cause: { cause: { code: "23505" } } }), true);
  assert.equal(esViolacionDeUnicidad({ code: "23503" }), false);
  assert.equal(esViolacionDeUnicidad(null), false);
  assert.equal(esViolacionDeUnicidad("23505"), false);
});

test("marcaje.ts: el caso ok ya no hace dos escrituras sueltas y los rechazos siguen en bitacora", () => {
  const fuente = readFileSync(new URL("../src/lib/qr/marcaje.ts", import.meta.url), "utf8");

  // Ninguna anotacion "ok" suelta ni insert directo a asistencia: todo pasa por el batch.
  assert.doesNotMatch(fuente, /anotar\([^)]*"ok"/);
  assert.doesNotMatch(fuente, /db\.insert\(asistencia\)/);
  assert.equal((fuente.match(/escribirMarcajeOk\(db/g) ?? []).length, 2);

  // Cada rechazo conserva su rastro individual en bitacora.
  for (const r of ["invalido", "sin_perfil", "fuera_de_horario", "duplicado", "fuera_de_zona"]) {
    assert.match(fuente, new RegExp(`anotar\\([^)]*"${r}"`), `falta anotar ${r}`);
  }
  assert.match(fuente, /anotar\([^)]*veredicto/); // expirado / invalido por codigo
});

test("marcaje.ts: el orden de comprobaciones sigue siendo perfil, estado, horario, duplicado, codigo, zona", () => {
  const fuente = readFileSync(new URL("../src/lib/qr/marcaje.ts", import.meta.url), "utf8");
  const cuerpo = fuente.slice(fuente.indexOf("export async function registrarMarcaje("));
  const orden = [
    "!alumno.perfilCompleto",
    'estado !== "publicada"',
    "momento < laActividad.marcajeAbreEn",
    "yaMarco",
    "validarCodigo(",
    'zona === "fuera"',
    "escribirMarcajeOk(",
  ].map((marca) => cuerpo.indexOf(marca));

  assert.ok(orden.every((i) => i >= 0), "falta alguna comprobacion");
  assert.deepEqual([...orden].sort((x, y) => x - y), orden);
});
