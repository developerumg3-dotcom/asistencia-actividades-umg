/*
 * Pruebas de la derivacion y validacion del codigo del QR.
 *
 *     pnpm probar
 *
 * Usa el runner que trae Node (node:test), sin dependencias extra.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  GRACIA_SEG,
  LARGO_CODIGO,
  codigoVigente,
  codigosProximos,
  derivarCodigo,
  generarSecreto,
  inicioDeSlot,
  segundosRestantes,
  slotDe,
  urlDeMarcaje,
  validarCodigo,
} from "../src/lib/qr/codigo.ts";

const SECRETO = Buffer.from("secreto-fijo-de-prueba-32-bytes!", "utf8");
const OTRO_SECRETO = Buffer.from("otro-secreto-distinto-de-32-byte", "utf8");
const ACTIVIDAD = "11111111-2222-3333-4444-555555555555";
const VENTANA = 60;

/** Un momento exacto sobre el borde de un slot, para razonar sin ambiguedad. */
const INICIO = new Date("2026-09-05T14:00:00.000Z");
const enSegundo = (s: number) => new Date(INICIO.getTime() + s * 1000);

test("el codigo tiene el largo definido y es base64url", () => {
  const codigo = codigoVigente(SECRETO, ACTIVIDAD, VENTANA, INICIO);
  assert.equal(codigo.length, LARGO_CODIGO);
  assert.match(codigo, /^[A-Za-z0-9_-]+$/);
});

test("el mismo slot siempre da el mismo codigo", () => {
  assert.equal(
    codigoVigente(SECRETO, ACTIVIDAD, VENTANA, INICIO),
    codigoVigente(SECRETO, ACTIVIDAD, VENTANA, enSegundo(59)),
  );
});

test("cambia al cruzar a la ventana siguiente", () => {
  assert.notEqual(
    codigoVigente(SECRETO, ACTIVIDAD, VENTANA, enSegundo(59)),
    codigoVigente(SECRETO, ACTIVIDAD, VENTANA, enSegundo(60)),
  );
});

test("dos actividades no comparten codigo en el mismo slot", () => {
  const slot = slotDe(INICIO, VENTANA);
  assert.notEqual(
    derivarCodigo(SECRETO, ACTIVIDAD, slot),
    derivarCodigo(SECRETO, "otra-actividad", slot),
  );
});

test("dos secretos distintos no dan el mismo codigo", () => {
  const slot = slotDe(INICIO, VENTANA);
  assert.notEqual(
    derivarCodigo(SECRETO, ACTIVIDAD, slot),
    derivarCodigo(OTRO_SECRETO, ACTIVIDAD, slot),
  );
});

test("el secreto generado tiene 32 bytes y no se repite", () => {
  const a = generarSecreto();
  assert.equal(a.length, 32);
  assert.notEqual(a.toString("hex"), generarSecreto().toString("hex"));
});

test("el codigo vigente se acepta en cualquier punto de su ventana", () => {
  const codigo = codigoVigente(SECRETO, ACTIVIDAD, VENTANA, INICIO);
  for (const segundo of [0, 1, 30, 59]) {
    assert.equal(
      validarCodigo({
        secreto: SECRETO,
        actividadId: ACTIVIDAD,
        ventanaSeg: VENTANA,
        codigo,
        momento: enSegundo(segundo),
      }),
      "ok",
      `fallo en el segundo ${segundo}`,
    );
  }
});

test("el codigo anterior sigue valiendo dentro de la gracia", () => {
  const anterior = codigoVigente(SECRETO, ACTIVIDAD, VENTANA, INICIO);
  // Ya estamos en el slot siguiente, pero apenas entrando.
  const resultado = validarCodigo({
    secreto: SECRETO,
    actividadId: ACTIVIDAD,
    ventanaSeg: VENTANA,
    codigo: anterior,
    momento: enSegundo(60 + GRACIA_SEG - 1),
  });
  assert.equal(resultado, "ok");
});

test("el codigo anterior expira al terminar la gracia", () => {
  const anterior = codigoVigente(SECRETO, ACTIVIDAD, VENTANA, INICIO);
  const resultado = validarCodigo({
    secreto: SECRETO,
    actividadId: ACTIVIDAD,
    ventanaSeg: VENTANA,
    codigo: anterior,
    momento: enSegundo(60 + GRACIA_SEG),
  });
  assert.equal(resultado, "expirado");
});

test("la foto del QR compartida un minuto despues no sirve", () => {
  const fotografiado = codigoVigente(SECRETO, ACTIVIDAD, VENTANA, INICIO);
  const resultado = validarCodigo({
    secreto: SECRETO,
    actividadId: ACTIVIDAD,
    ventanaSeg: VENTANA,
    codigo: fotografiado,
    momento: enSegundo(180),
  });
  assert.equal(resultado, "expirado");
});

test("un codigo muy viejo ya no se reconoce siquiera", () => {
  const viejo = codigoVigente(SECRETO, ACTIVIDAD, VENTANA, INICIO);
  const resultado = validarCodigo({
    secreto: SECRETO,
    actividadId: ACTIVIDAD,
    ventanaSeg: VENTANA,
    codigo: viejo,
    momento: enSegundo(60 * 30),
  });
  assert.equal(resultado, "invalido");
});

test("un codigo de otra actividad es invalido", () => {
  const ajeno = codigoVigente(SECRETO, "otra-actividad", VENTANA, INICIO);
  const resultado = validarCodigo({
    secreto: SECRETO,
    actividadId: ACTIVIDAD,
    ventanaSeg: VENTANA,
    codigo: ajeno,
    momento: INICIO,
  });
  assert.equal(resultado, "invalido");
});

test("codigos malformados no revientan la validacion", () => {
  for (const codigo of ["", "corto", "x".repeat(64), "!!!!!!!!!!"]) {
    const resultado = validarCodigo({
      secreto: SECRETO,
      actividadId: ACTIVIDAD,
      ventanaSeg: VENTANA,
      codigo,
      momento: INICIO,
    });
    assert.equal(resultado, "invalido", `fallo con ${JSON.stringify(codigo)}`);
  }
});

test("un reloj adelantado da expirado, no invalido", () => {
  const delFuturo = codigoVigente(SECRETO, ACTIVIDAD, VENTANA, enSegundo(60));
  const resultado = validarCodigo({
    secreto: SECRETO,
    actividadId: ACTIVIDAD,
    ventanaSeg: VENTANA,
    codigo: delFuturo,
    momento: INICIO,
  });
  assert.equal(resultado, "expirado");
});

test("la ventana configurable se respeta", () => {
  const codigo = codigoVigente(SECRETO, ACTIVIDAD, 30, INICIO);
  assert.equal(
    validarCodigo({
      secreto: SECRETO,
      actividadId: ACTIVIDAD,
      ventanaSeg: 30,
      codigo,
      momento: enSegundo(29),
    }),
    "ok",
  );
  assert.equal(
    validarCodigo({
      secreto: SECRETO,
      actividadId: ACTIVIDAD,
      ventanaSeg: 30,
      codigo,
      momento: enSegundo(45),
    }),
    "expirado",
  );
});

test("una ventana invalida falla fuerte en vez de dar codigos raros", () => {
  for (const ventana of [0, -60, Number.NaN]) {
    assert.throws(() => slotDe(INICIO, ventana), RangeError);
  }
});

test("la precarga devuelve codigos consecutivos y distintos", () => {
  const proximos = codigosProximos(SECRETO, ACTIVIDAD, VENTANA, INICIO, 5);
  assert.equal(proximos.length, 5);
  assert.equal(proximos[0].codigo, codigoVigente(SECRETO, ACTIVIDAD, VENTANA, INICIO));
  assert.equal(new Set(proximos.map((p) => p.codigo)).size, 5);
  for (let i = 1; i < proximos.length; i++) {
    assert.equal(proximos[i].slot, proximos[i - 1].slot + 1);
    assert.equal(
      proximos[i].vigenteDesde.getTime() - proximos[i - 1].vigenteDesde.getTime(),
      VENTANA * 1000,
    );
  }
});

test("cada codigo precargado es el que valdra en su momento", () => {
  const proximos = codigosProximos(SECRETO, ACTIVIDAD, VENTANA, INICIO, 5);
  for (const programado of proximos) {
    assert.equal(
      validarCodigo({
        secreto: SECRETO,
        actividadId: ACTIVIDAD,
        ventanaSeg: VENTANA,
        codigo: programado.codigo,
        momento: new Date(programado.vigenteDesde.getTime() + 1000),
      }),
      "ok",
    );
  }
});

test("el contador regresivo va de la ventana a 1", () => {
  assert.equal(segundosRestantes(INICIO, VENTANA), 60);
  assert.equal(segundosRestantes(enSegundo(59), VENTANA), 1);
  assert.equal(segundosRestantes(enSegundo(60), VENTANA), 60);
});

test("el inicio de slot es coherente con el slot", () => {
  const slot = slotDe(enSegundo(37), VENTANA);
  assert.equal(inicioDeSlot(slot, VENTANA).toISOString(), INICIO.toISOString());
});

test("la url del QR queda corta y sin barra doble", () => {
  assert.equal(
    urlDeMarcaje("https://asistencia-umg.vercel.app/", "a7", "AbCdEfGhIj"),
    "https://asistencia-umg.vercel.app/a/a7/AbCdEfGhIj",
  );
});
