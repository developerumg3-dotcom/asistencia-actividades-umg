/*
 * Pruebas del motor de reportes (B7, B10 — Fase 4): la tabla alumno x actividad de una clase,
 * la misma que alimenta la hoja de Excel de PLANIFICACION.md §9.
 *
 *     pnpm probar
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { calcularReporteDeClase, type AlumnoParaReporte } from "../src/lib/puntos/calculo.ts";

const ACTIVIDADES_GLOBALES = [
  { id: "act-1", nombre: "Actividad 1" },
  { id: "act-2", nombre: "Actividad 2" },
];

const MARIA: AlumnoParaReporte = { id: "a-maria", carne: "0905-22-1234", nombre: "María García", email: "maria@x.com" };
const JUAN: AlumnoParaReporte = { id: "a-juan", carne: "0905-22-5678", nombre: "Juan Pérez", email: "juan@x.com" };
const SIN_CARNE: AlumnoParaReporte = { id: "a-sc", carne: null, nombre: null, email: "sincarne@x.com" };

test("ordena por nombre (o correo si no hay nombre), sin filtrar a nadie", () => {
  const filas = calcularReporteDeClase({
    alumnos: [JUAN, SIN_CARNE, MARIA],
    actividadesGlobales: ACTIVIDADES_GLOBALES,
    asistenciasPorAlumno: new Map(),
    extraPorAlumno: new Map(),
  });

  assert.deepEqual(
    filas.map((f) => f.nombreOCorreo),
    ["Juan Pérez", "María García", "sincarne@x.com"],
  );
});

test("un alumno sin carné se exporta igual, con la celda vacía", () => {
  const [fila] = calcularReporteDeClase({
    alumnos: [SIN_CARNE],
    actividadesGlobales: ACTIVIDADES_GLOBALES,
    asistenciasPorAlumno: new Map(),
    extraPorAlumno: new Map(),
  });

  assert.equal(fila.carne, null);
  assert.equal(fila.total, 0);
});

test("suma marcas de actividades globales más el extra de esa clase", () => {
  const [fila] = calcularReporteDeClase({
    alumnos: [MARIA],
    actividadesGlobales: ACTIVIDADES_GLOBALES,
    asistenciasPorAlumno: new Map([[MARIA.id, new Set(["act-1"])]]),
    extraPorAlumno: new Map([[MARIA.id, 2]]),
  });

  assert.deepEqual(fila.marcas, { "act-1": 1, "act-2": 0 });
  assert.equal(fila.extra, 2);
  assert.equal(fila.total, 3);
});

test("un alumno sin ninguna marca ni extra da todo en cero, no se omite", () => {
  const [fila] = calcularReporteDeClase({
    alumnos: [JUAN],
    actividadesGlobales: ACTIVIDADES_GLOBALES,
    asistenciasPorAlumno: new Map(),
    extraPorAlumno: new Map(),
  });

  assert.deepEqual(fila.marcas, { "act-1": 0, "act-2": 0 });
  assert.equal(fila.total, 0);
});
