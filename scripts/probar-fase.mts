/*
 * Pruebas de la fase de marcaje (entrada o salida) del doble marcaje, sin base.
 *
 *     pnpm probar
 *
 * PLANIFICACION.md §6.5. El ejemplo de referencia: actividad de 2:00 a 4:00 p. m., entrada de
 * 2:00 a 2:30 y salida de 3:30 a 4:00.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { cierreFinal, faseVigente, type VentanasDeMarcaje } from "../src/lib/qr/fase.ts";

// Guatemala es UTC-6: las 2:00 p. m. son las 20:00 UTC.
const hora = (h: number, m = 0) => new Date(Date.UTC(2026, 9, 24, h + 6, m));

const DOBLE: VentanasDeMarcaje = {
  marcajeAbreEn: hora(14, 0),
  marcajeCierraEn: hora(14, 30),
  dobleMarcaje: true,
  salidaAbreEn: hora(15, 30),
  salidaCierraEn: hora(16, 0),
};

const SIMPLE: VentanasDeMarcaje = {
  marcajeAbreEn: hora(16, 30),
  marcajeCierraEn: hora(18, 0),
  dobleMarcaje: false,
  salidaAbreEn: null,
  salidaCierraEn: null,
};

test("dentro del rango de entrada es entrada", () => {
  assert.equal(faseVigente(DOBLE, hora(14, 0)), "entrada");
  assert.equal(faseVigente(DOBLE, hora(14, 15)), "entrada");
  assert.equal(faseVigente(DOBLE, hora(14, 30)), "entrada");
});

test("dentro del rango de salida es salida", () => {
  assert.equal(faseVigente(DOBLE, hora(15, 30)), "salida");
  assert.equal(faseVigente(DOBLE, hora(15, 59)), "salida");
  assert.equal(faseVigente(DOBLE, hora(16, 0)), "salida");
});

test("el hueco entre las dos y todo lo de fuera no es ninguna fase", () => {
  assert.equal(faseVigente(DOBLE, hora(13, 59)), null, "antes de la entrada");
  assert.equal(faseVigente(DOBLE, hora(14, 31)), null, "justo despues de la entrada");
  assert.equal(faseVigente(DOBLE, hora(15, 0)), null, "en el hueco");
  assert.equal(faseVigente(DOBLE, hora(16, 1)), null, "despues de la salida");
});

test("una actividad de un solo marcaje solo tiene entrada, y su salida no existe", () => {
  assert.equal(faseVigente(SIMPLE, hora(17, 0)), "entrada");
  assert.equal(faseVigente(SIMPLE, hora(18, 1)), null);
});

test("sin doble marcaje no hay salida aunque las columnas traigan fechas", () => {
  const raro = { ...SIMPLE, salidaAbreEn: hora(19, 0), salidaCierraEn: hora(19, 30) };
  assert.equal(faseVigente(raro, hora(19, 15)), null);
});

test("el cierre final es el de la salida si hay doble marcaje, y el de la entrada si no", () => {
  assert.deepEqual(cierreFinal(DOBLE), hora(16, 0));
  assert.deepEqual(cierreFinal(SIMPLE), hora(18, 0));
});
