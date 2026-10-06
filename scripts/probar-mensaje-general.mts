/*
 * Pruebas de la lógica pura del aviso general (/admin/notificaciones): validar el texto,
 * armar el aviso, el tag que evita que un aviso pise a otro, la ruta interna y la guarda
 * contra el doble envío.
 *
 *     corepack pnpm probar
 *
 * Sin red ni base, y sobre todo SIN enviar nada: hay gente real suscrita.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { esRutaInterna, resumenDeEnvio, textoDeAviso } from "../src/lib/push/aviso.ts";
import {
  LIMITE_MENSAJE,
  LIMITE_TITULO,
  PREFIJO_PRUEBA,
  armarAvisoGeneral,
  crearGuardaEnvios,
  idDeEnvioValido,
  validarMensajeGeneral,
} from "../src/lib/push/mensaje-general.ts";

const ID_A = "11111111-1111-4111-8111-111111111111";
const ID_B = "22222222-2222-4222-8222-222222222222";

test("un aviso normal pasa y se devuelve tal cual", () => {
  const r = validarMensajeGeneral({ titulo: "Convocatoria", mensaje: "Se les convoca a todos al salón 3, vengan" });
  assert.ok(r.ok);
  assert.equal(r.texto.titulo, "Convocatoria");
  assert.equal(r.texto.mensaje, "Se les convoca a todos al salón 3, vengan");
});

test("título y mensaje vacíos o solo espacios se rechazan, cada uno con su error", () => {
  const r = validarMensajeGeneral({ titulo: "   ", mensaje: "\n\t " });
  assert.ok(!r.ok);
  assert.ok(r.errores.titulo);
  assert.ok(r.errores.mensaje);
});

test("lo que no es texto se rechaza sin reventar", () => {
  for (const basura of [null, undefined, 42, [], { titulo: 1, mensaje: {} }, { titulo: ["a"], mensaje: null }]) {
    const r = validarMensajeGeneral(basura);
    assert.ok(!r.ok, `aceptó ${JSON.stringify(basura)}`);
  }
});

test("los límites de largo son exactos", () => {
  assert.ok(validarMensajeGeneral({ titulo: "a".repeat(LIMITE_TITULO), mensaje: "b".repeat(LIMITE_MENSAJE) }).ok);

  const largoT = validarMensajeGeneral({ titulo: "a".repeat(LIMITE_TITULO + 1), mensaje: "ok" });
  assert.ok(!largoT.ok && largoT.errores.titulo && !largoT.errores.mensaje);

  const largoM = validarMensajeGeneral({ titulo: "ok", mensaje: "b".repeat(LIMITE_MENSAJE + 1) });
  assert.ok(!largoM.ok && largoM.errores.mensaje && !largoM.errores.titulo);
});

test("un texto enorme no revienta el payload: se rechaza antes", () => {
  const r = validarMensajeGeneral({ titulo: "x", mensaje: "y".repeat(100_000) });
  assert.ok(!r.ok);
});

test("el largo se mide después de limpiar, no antes", () => {
  // Espacios de más y saltos no cuentan: el límite es de lo que de verdad se manda.
  const r = validarMensajeGeneral({ titulo: "  hola     mundo  ", mensaje: "uno\n\n\n\n\ndos" });
  assert.ok(r.ok);
  assert.equal(r.texto.titulo, "hola mundo");
  assert.equal(r.texto.mensaje, "uno\n\ndos");
});

test("el título es de una sola línea", () => {
  const r = validarMensajeGeneral({ titulo: "linea1\nlinea2", mensaje: "m" });
  assert.ok(r.ok);
  assert.equal(r.texto.titulo, "linea1 linea2");
});

test("las etiquetas HTML se rechazan", () => {
  for (const html of [
    "<b>urgente</b>",
    "<script>alert(1)</script>",
    '<img src=x onerror="alert(1)">',
    "<!-- nota -->",
    "hola <a href='https://evil.com'>click</a>",
    "</p>",
  ]) {
    const comoMensaje = validarMensajeGeneral({ titulo: "t", mensaje: html });
    assert.ok(!comoMensaje.ok && comoMensaje.errores.mensaje, `aceptó en mensaje: ${html}`);
    const comoTitulo = validarMensajeGeneral({ titulo: html, mensaje: "m" });
    assert.ok(!comoTitulo.ok && comoTitulo.errores.titulo, `aceptó en título: ${html}`);
  }
});

test("los signos < y > sueltos, sin forma de etiqueta, sí pasan", () => {
  assert.ok(validarMensajeGeneral({ titulo: "Cupo", mensaje: "Si faltan < 5 o sobran > 3, avisen" }).ok);
});

test("los caracteres de control e invisibles se quitan", () => {
  // Bidireccionales y de ancho cero sirven para que en la pantalla bloqueada se lea otra cosa.
  const r = validarMensajeGeneral({
    titulo: "Sa​lón‮ 3",
    mensaje: "a\u0000b\u0007c﻿d⁦e",
  });
  assert.ok(r.ok);
  assert.equal(r.texto.titulo, "Salón 3");
  assert.equal(r.texto.mensaje, "abcde");
});

test("un mensaje que solo tenía invisibles queda vacío y se rechaza", () => {
  const r = validarMensajeGeneral({ titulo: "t", mensaje: "​​﻿" });
  assert.ok(!r.ok && r.errores.mensaje);
});

test("el aviso general lleva el texto, un id y una ruta interna", () => {
  const aviso = armarAvisoGeneral({ titulo: "Convocatoria", mensaje: "Salón 3" }, ID_A);
  assert.equal(aviso.titulo, "Convocatoria");
  assert.equal(aviso.cuerpo, "Salón 3");
  assert.equal(aviso.id, `general-${ID_A}`);
  assert.equal(aviso.url, "/inicio");
  assert.ok(esRutaInterna(aviso.url));
});

test("dos avisos distintos tienen tag distinto: conviven en la bandeja", () => {
  const uno = armarAvisoGeneral({ titulo: "Uno", mensaje: "m" }, ID_A);
  const dos = armarAvisoGeneral({ titulo: "Dos", mensaje: "m" }, ID_B);
  assert.notEqual(uno.id, dos.id);
  // Y esto es justo lo que antes pasaba: misma URL.
  assert.equal(uno.url, dos.url);
});

test("el reintento del mismo envío tiene el mismo tag: se reemplaza, no se duplica", () => {
  const primero = armarAvisoGeneral({ titulo: "Uno", mensaje: "m" }, ID_A);
  const reintento = armarAvisoGeneral({ titulo: "Uno", mensaje: "m" }, ID_A);
  assert.equal(primero.id, reintento.id);
});

test("la prueba va marcada y su tag nunca coincide con el del aviso real", () => {
  const real = armarAvisoGeneral({ titulo: "Convocatoria", mensaje: "m" }, ID_A);
  const prueba = armarAvisoGeneral({ titulo: "Convocatoria", mensaje: "m" }, ID_A, { prueba: true });
  assert.equal(prueba.titulo, `${PREFIJO_PRUEBA}Convocatoria`);
  assert.notEqual(prueba.id, real.id);
  assert.equal(real.titulo, "Convocatoria");
});

test("un id de envío con forma rara se rechaza", () => {
  for (const malo of ["", "corto", "con espacios en el id", "../../etc", "a".repeat(65), "x/y/z/w/v/u", null, 7, undefined]) {
    assert.ok(!idDeEnvioValido(malo), `aceptó ${String(malo)}`);
  }
  assert.ok(idDeEnvioValido(ID_A));
  assert.throws(() => armarAvisoGeneral({ titulo: "t", mensaje: "m" }, "no valido"));
});

test("el aviso de una actividad también tiene id propio, distinto por actividad", () => {
  const base = { nombre: "Conferencia", lugar: null, iniciaEn: new Date("2026-09-05T20:30:00Z") };
  const a = textoDeAviso({ ...base, id: "act-1" });
  const b = textoDeAviso({ ...base, id: "act-2" });
  assert.notEqual(a.id, b.id);
  assert.equal(a.id, textoDeAviso({ ...base, id: "act-1" }).id, "reenviar la misma actividad reemplaza");
  assert.ok(!a.id.startsWith("general-"));
});

test("esRutaInterna acepta rutas del sitio", () => {
  for (const ok of ["/", "/inicio", "/actividades/3?x=1#a", "/admin/notificaciones"]) {
    assert.ok(esRutaInterna(ok), ok);
  }
});

test("esRutaInterna rechaza todo lo que sale del sitio", () => {
  for (const mala of [
    "",
    "inicio",
    "https://evil.com",
    "http://evil.com/inicio",
    "//evil.com",
    "//evil.com/inicio",
    "/\\evil.com",
    "\\\\evil.com",
    "javascript:alert(1)",
    "data:text/html,hola",
    "/inicio\nhttps://evil.com",
    "/ini\tcio",
    " /inicio",
  ]) {
    assert.ok(!esRutaInterna(mala), `aceptó ${JSON.stringify(mala)}`);
  }
});

test("el service worker usa el id del aviso como tag, no la URL", () => {
  const sw = readFileSync(new URL("../public/sw.js", import.meta.url), "utf8");
  assert.match(sw, /tag:\s*aviso\.id/, "el tag tiene que salir del id del aviso");
  assert.doesNotMatch(sw, /tag:\s*aviso\.url/, "con la URL de tag, un aviso borra al anterior");
  assert.match(sw, /function rutaInterna/, "el SW tiene que filtrar la URL que abre");
});

test("la guarda deja pasar un id una sola vez", () => {
  const guarda = crearGuardaEnvios();
  assert.equal(guarda.reservar(ID_A), true);
  assert.equal(guarda.reservar(ID_A), false, "el segundo clic no tiene que enviar");
  assert.equal(guarda.reservar(ID_B), true, "otro aviso sí");
});

test("la guarda libera un id cuando el envío no salió", () => {
  const guarda = crearGuardaEnvios();
  guarda.reservar(ID_A);
  guarda.liberar(ID_A);
  assert.equal(guarda.reservar(ID_A), true);
});

test("la guarda olvida los ids vencidos", () => {
  let ahora = 1_000;
  const guarda = crearGuardaEnvios(60_000, () => ahora);
  assert.equal(guarda.reservar(ID_A), true);
  ahora += 59_999;
  assert.equal(guarda.reservar(ID_A), false);
  ahora += 1;
  assert.equal(guarda.reservar(ID_A), true);
});

test("el resumen del envío cuenta dispositivos y avisa de lo que no llegó", () => {
  assert.equal(resumenDeEnvio({ entregados: 1, borradas: 0, fallidos: 0 }), "Enviado a 1 dispositivo.");
  const r = resumenDeEnvio({ entregados: 3, borradas: 1, fallidos: 2 });
  assert.ok(r.includes("3 dispositivos") && r.includes("1 que ya no existen") && r.includes("2 fallaron"), r);
});
