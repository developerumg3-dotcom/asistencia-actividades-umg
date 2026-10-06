import assert from "node:assert/strict";
import { test } from "node:test";
import { drizzle } from "drizzle-orm/neon-http";
import { PgDialect } from "drizzle-orm/pg-core";
import { readFileSync } from "node:fs";
import * as esquema from "../src/db/esquema/index.ts";
import { reservarEnBatch } from "../src/lib/push/escritura-envio.ts";
import { claveAvisoActividad, crearAvisoActividad, reservarEntregas } from "../src/lib/push/consultas-envio.ts";
import { clasificarFalloPush, esEndpointPush, esFalloReintentable, esSuscripcionPush } from "../src/lib/push/validacion.ts";
import { procesarEntrega } from "../src/lib/push/proceso-entrega.ts";

const dialecto = new PgDialect();
const id = "11111111-1111-4111-8111-111111111111";

test("UUID con diferente capitalizacion reutiliza la solicitud, reenvio tiene otra identidad", () => {
  const actividad = "abcdefab-abcd-4abc-8abc-abcdefabcdef";
  assert.equal(claveAvisoActividad(actividad), claveAvisoActividad(actividad.toUpperCase()));
  assert.notEqual(claveAvisoActividad(actividad), claveAvisoActividad(actividad, id));
  assert.equal(claveAvisoActividad(actividad, actividad), claveAvisoActividad(actividad, actividad.toUpperCase()));
});

test("reserva usa candado, descarte y escritura separados en UN batch", async () => {
  const sentencias: string[] = [];
  const base = drizzle("postgresql://usuario:clave@localhost.invalid/prueba", { schema: esquema });
  const espia = {
    execute: (consulta: Parameters<typeof base.execute>[0]) => {
      sentencias.push(dialecto.sqlToQuery(consulta as Parameters<typeof dialecto.sqlToQuery>[0]).sql);
      return {};
    },
    batch: async (consultas: unknown[]) => {
      assert.equal(consultas.length, 3);
      return [{ rows: [] }, { rows: [] }, { rows: [] }];
    },
  } as unknown as typeof base;
  await reservarEnBatch(espia, id);
  assert.match(sentencias[0], /^SELECT pg_advisory_xact_lock/);
  assert.doesNotMatch(sentencias[1], /advisory/);
  assert.match(sentencias[1], /NOT EXISTS/);
  assert.match(sentencias[2], /UPDATE entrega_push/);
  assert.doesNotMatch(sentencias[2], /advisory/);
});

test("aceptadas y envios inciertos no se reservan otra vez", () => {
  const q = dialecto.sqlToQuery(reservarEntregas(id));
  assert.match(q.sql, /e.estado = 'pendiente'/);
  assert.match(q.sql, /e.estado = 'fallida' AND e.reintentar_en IS NOT NULL/);
  assert.doesNotMatch(q.sql, /e.estado = '(aceptada|procesando|incierta)'/);
  assert.match(q.sql, /e.intentos < 3/);
  assert.match(q.sql, /s.alumno_id = e.alumno_id/);
  assert.match(q.sql, /a.estado = 'activo'/);
  assert.deepEqual(q.params, [id]);
});

test("solo un aviso nuevo congela destinatarios; otro clic no agrega ni reinicia entregas", () => {
  const q = dialecto.sqlToQuery(crearAvisoActividad("actividad:1:inicial", id, "alumno-texto", {
    titulo: "Hola' --", cuerpo: "Aviso", url: "/inicio",
  }));
  assert.match(q.sql, /ON CONFLICT \(clave\) DO NOTHING RETURNING id/);
  assert.match(q.sql, /FROM nuevo n CROSS JOIN suscripcion_push/);
  assert.match(q.sql, /ON CONFLICT \(aviso_id, suscripcion_id\) DO NOTHING/);
  assert.ok(!q.sql.includes("Hola' --"));
  assert.equal(q.params[2], "Hola' --");
});

test("solo proveedores HTTPS autorizados: no URL privada, credenciales ni host engañoso", () => {
  for (const url of ["https://fcm.googleapis.com/wp/prueba", "https://updates.push.services.mozilla.com/wpush/v2/prueba", "https://web.push.apple.com/prueba"]) {
    assert.equal(esEndpointPush(url), true);
  }
  for (const url of [null, {}, "http://fcm.googleapis.com/x", "https://127.0.0.1/x", "https://169.254.169.254/x", "https://localhost/x", "https://fcm.googleapis.com.ejemplo.com/x", "https://web.push.apple.com.ejemplo.com/x", "https://usuario@fcm.googleapis.com/x", "https://fcm.googleapis.com:444/x", "https://fcm.googleapis.com/x#fragmento", "https://fcm.googleapis.com\\@ejemplo.com/x"]) {
    assert.equal(esEndpointPush(url), false);
  }
});

test("claves de suscripcion requieren tipos y tamaños Web Push", () => {
  const publica = Buffer.alloc(65); publica[0] = 4;
  const datos = { endpoint: "https://fcm.googleapis.com/wp/prueba", p256dh: publica.toString("base64url"), auth: Buffer.alloc(16).toString("base64url") };
  assert.equal(esSuscripcionPush(datos), true);
  assert.equal(esSuscripcionPush({ ...datos, auth: "x" }), false);
  assert.equal(esSuscripcionPush({ ...datos, p256dh: Buffer.alloc(65).toString("base64url") }), false);
  assert.equal(esSuscripcionPush(undefined), false);
});

test("reintentos limitados a fallos temporales; sin respuesta es incierto", () => {
  assert.equal(clasificarFalloPush(undefined), "incierta");
  assert.equal(clasificarFalloPush(410), "descartada");
  for (const codigo of [undefined, 400, 401, 403, 404, 410]) assert.equal(esFalloReintentable(codigo), false);
  for (const codigo of [429, 500, 503]) assert.equal(esFalloReintentable(codigo), true);
});

test("el transporte valida datos anteriores y no imprime errores enteros", () => {
  const fuente = readFileSync(new URL("../src/lib/push/envio.ts", import.meta.url), "utf8");
  assert.doesNotMatch(fuente, /console\.error\([^;]*,\s*error\)/);
  assert.match(fuente, /esSuscripcionPush\(e\)/);
  assert.match(fuente, /sigueVigente\(e\)/);
});

test("si persiste mal despues de aceptar, no cambia a fallida ni vuelve a enviar", async () => {
  let envios = 0;
  const estados: string[] = [];
  await assert.rejects(procesarEntrega({
    vigente: async () => true,
    enviar: async () => { envios++; },
    codigo: () => undefined,
    anotarFallo: () => assert.fail("no fue un fallo de red"),
    guardar: async (estado) => { estados.push(estado); throw new Error("fallo de base"); },
    baja: async () => assert.fail("no se borra la suscripcion"),
  }), /fallo de base/);
  assert.equal(envios, 1);
  assert.deepEqual(estados, ["aceptada"]);
});

test("sin respuesta queda incierta; destinatario desactivado no hace peticion", async () => {
  const estados: string[] = [];
  let vigente = true;
  let envios = 0;
  const servicios = {
    vigente: async () => vigente,
    enviar: async () => { envios++; throw new Error("timeout"); },
    codigo: () => undefined,
    anotarFallo: () => {},
    guardar: async (estado: string) => { estados.push(estado); },
    baja: async () => assert.fail("no tiene 404/410"),
  };
  await procesarEntrega(servicios);
  vigente = false;
  await procesarEntrega(servicios);
  assert.equal(envios, 1);
  assert.deepEqual(estados, ["incierta", "descartada"]);
});
