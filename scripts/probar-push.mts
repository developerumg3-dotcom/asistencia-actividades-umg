/*
 * Pruebas de la lógica pura de las notificaciones push: el texto del aviso que sale de una
 * actividad, y qué se hace con una suscripción que falló.
 *
 *     pnpm probar
 *
 * Sin red y sin base: `src/lib/push/aviso.ts` no toca ninguna de las dos justamente para que
 * estas dos decisiones se puedan probar. El envío (`envio.ts`) solo aplica lo que decide acá.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  decidirSobreError,
  frasePorcentajeAlcance,
  textoDeAviso,
  type ActividadParaAviso,
} from "../src/lib/push/aviso.ts";

/** 5 de septiembre de 2026, 14:30 en Guatemala (UTC−6) = 20:30 UTC. */
const CONFERENCIA: ActividadParaAviso = {
  id: "a1b2c3",
  nombre: "Conferencia de ingeniería",
  lugar: "Salón 204",
  iniciaEn: new Date("2026-09-05T20:30:00Z"),
};

test("el titulo del aviso es el nombre de la actividad tal cual", () => {
  // Es lo unico que se ve seguro en la bandeja: el cuerpo lo recorta cada sistema.
  assert.equal(textoDeAviso(CONFERENCIA).titulo, "Conferencia de ingeniería");
});

test("el cuerpo lleva la fecha en hora de Guatemala, no en UTC", () => {
  const { cuerpo } = textoDeAviso(CONFERENCIA);
  assert.ok(cuerpo.includes("2:30"), `dio "${cuerpo}"`);
  assert.ok(cuerpo.includes("p. m."), `la hora de Guatemala es de la tarde, dio "${cuerpo}"`);
  assert.ok(!cuerpo.includes("8:30"), `8:30 seria UTC sin convertir, dio "${cuerpo}"`);
});

test("el cuerpo lleva el lugar despues de la fecha", () => {
  const { cuerpo } = textoDeAviso(CONFERENCIA);
  assert.ok(cuerpo.includes("Salón 204"), `dio "${cuerpo}"`);
  assert.ok(
    cuerpo.indexOf("Salón 204") > cuerpo.indexOf("2:30"),
    "si el sistema corta el cuerpo, lo que se pierde tiene que ser el lugar, no la hora",
  );
});

test("una actividad sin lugar no deja un separador colgando", () => {
  const { cuerpo } = textoDeAviso({ ...CONFERENCIA, lugar: null });
  assert.ok(!cuerpo.includes("·"), `dio "${cuerpo}"`);
  assert.ok(cuerpo.includes("2:30"), `dio "${cuerpo}"`);
});

test("el aviso abre el inicio, no la pantalla de marcaje", () => {
  // El marcaje se abre escaneando el QR del evento, nunca desde un enlace.
  assert.equal(textoDeAviso(CONFERENCIA).url, "/inicio");
});

test("404 y 410 borran la suscripcion", () => {
  // El servicio dice que esa direccion ya no existe: desinstalaron o limpiaron datos.
  assert.equal(decidirSobreError(404), "borrar");
  assert.equal(decidirSobreError(410), "borrar");
});

test("429 y 500 no borran nada, solo marcan", () => {
  // Cuota y error del servicio son del momento, no de la suscripcion. Borrarlas seria
  // destruir suscripciones buenas por un problema nuestro, y el alumno no puede volver a
  // suscribirse: el navegador no pregunta dos veces.
  assert.equal(decidirSobreError(429), "marcar");
  assert.equal(decidirSobreError(500), "marcar");
});

test("un fallo sin codigo de respuesta tampoco borra", () => {
  // Se cayo la red antes de llegar al servicio: no dice nada sobre la suscripcion.
  assert.equal(decidirSobreError(undefined), "marcar");
});

test("401 y 403 no borran: el problema son nuestras claves", () => {
  assert.equal(decidirSobreError(401), "marcar");
  assert.equal(decidirSobreError(403), "marcar");
});

test("la frase de alcance dice a cuantos de cuantos", () => {
  assert.equal(frasePorcentajeAlcance(34, 120), "Le va a llegar a 34 de 120 alumnos.");
});

test("el plural concuerda con el total, no con los suscritos", () => {
  assert.equal(frasePorcentajeAlcance(1, 120), "Le va a llegar a 1 de 120 alumnos.");
  assert.equal(frasePorcentajeAlcance(1, 1), "Le va a llegar a 1 de 1 alumno.");
});

test("cero suscritos lo dice sin rodeos", () => {
  const frase = frasePorcentajeAlcance(0, 120);
  assert.ok(frase.includes("nadie"), `dio "${frase}"`);
  assert.ok(frase.includes("120"), `dio "${frase}"`);
});

test("sin alumnos registrados no se inventa una division por cero", () => {
  assert.equal(frasePorcentajeAlcance(0, 0), "Todavía no hay alumnos registrados.");
});
