/*
 * Pruebas de la conversion de fechas entre el formulario y la base.
 *
 *     pnpm probar
 *
 * Es donde se esconden los errores de seis horas: el servidor en Vercel corre en UTC y el
 * <input type="datetime-local"> no lleva zona.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { desdeCampoLocal, enGuatemala, haciaCampoLocal } from "../src/lib/fechas.ts";
import { codigoCortoAleatorio, esCodigoCortoValido } from "../src/lib/qr/codigo-corto.ts";

test("las 14:00 de Guatemala son las 20:00 UTC", () => {
  const instante = desdeCampoLocal("2026-09-05T14:00");
  assert.ok(instante);
  assert.equal(instante.toISOString(), "2026-09-05T20:00:00.000Z");
});

test("la medianoche de Guatemala no se corre de dia", () => {
  const instante = desdeCampoLocal("2026-09-05T00:00");
  assert.ok(instante);
  assert.equal(instante.toISOString(), "2026-09-05T06:00:00.000Z");
});

test("ida y vuelta devuelve lo mismo que se escribio", () => {
  for (const texto of [
    "2026-09-05T14:00",
    "2026-01-01T00:00",
    "2026-12-31T23:59",
    "2026-06-15T07:30",
  ]) {
    const instante = desdeCampoLocal(texto);
    assert.ok(instante, texto);
    assert.equal(haciaCampoLocal(instante), texto);
  }
});

test("un texto malformado no se convierte en una fecha cualquiera", () => {
  for (const texto of ["", "ayer", "2026-13-45T99:99", "2026-09-05"]) {
    assert.equal(desdeCampoLocal(texto), null, texto);
  }
});

test("se muestra en hora de Guatemala, no en UTC", () => {
  // 20:00 UTC son las 14:00 en Guatemala. `es-GT` usa reloj de 12 h, asi que se lee
  // "2:00 p. m."; lo que importa es que NO diga 8:00 p. m., que seria mostrar UTC crudo.
  const texto = enGuatemala(new Date("2026-09-05T20:00:00.000Z"));
  assert.match(texto, /\b2:00\b/);
  assert.match(texto, /p\.\s?m\./);
  assert.doesNotMatch(texto, /\b8:00\b/);
});

test("el codigo corto no trae caracteres que se confundan al leerlos", () => {
  const ambiguos = ["0", "o", "1", "i", "l", "2", "z", "5", "s", "8", "b"];
  for (let i = 0; i < 200; i++) {
    const codigo = codigoCortoAleatorio();
    assert.equal(codigo.length, 5);
    for (const caracter of ambiguos) {
      assert.ok(!codigo.includes(caracter), `${codigo} trae "${caracter}"`);
    }
  }
});

test("los codigos cortos no se repiten a cada rato", () => {
  const generados = new Set(Array.from({ length: 500 }, () => codigoCortoAleatorio()));
  // 25^5 combinaciones: 500 tiradas casi nunca chocan. Un margen amplio evita falsos rojos.
  assert.ok(generados.size > 490, `demasiadas repeticiones: ${generados.size}/500`);
});

test("la validacion del codigo corto rechaza lo que no corresponde", () => {
  assert.ok(esCodigoCortoValido(codigoCortoAleatorio()));
  for (const malo of ["", "ab", "con-guion", "MAYUS", "tiene0cero", "x".repeat(20)]) {
    assert.equal(esCodigoCortoValido(malo), false, malo);
  }
});
