/*
 * Pruebas del motor de calculo de puntos.
 *
 *     pnpm probar
 *
 * Usa el runner que trae Node (node:test), sin dependencias extra.
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  avisoEsUrgente,
  calcularFechaDeCorte,
  calcularParticipaciones,
  calcularSaldoExtra,
  calcularSaldoPorActividad,
  distribuirEntreActividadesExtra,
  esRepartoValido,
  repartoSigueAbierto,
  type ClaseInscrita,
} from "../src/lib/puntos/calculo.ts";

// ---- El ejemplo trabajado de PLANIFICACION.md §5 -----------------------------------------
//
// Maria esta en 3 clases. 5 actividades globales de 1 punto, asiste a 3 (1, 2 y 3, no 4 ni 5).
// Ademas asiste a la Feria Tecnologica (extra, 2 puntos) y reparte 1 en Redes y 1 en Bases de
// Datos.

const PROGRAMACION_II: ClaseInscrita = { id: "clase-p2", codigo: "P2", nombre: "Programación II" };
const BASES_DE_DATOS: ClaseInscrita = { id: "clase-bd", codigo: "BD", nombre: "Bases de Datos" };
const REDES: ClaseInscrita = { id: "clase-red", codigo: "RED", nombre: "Redes" };

const ACTIVIDADES_GLOBALES = [
  { id: "act-1", nombre: "Actividad 1" },
  { id: "act-2", nombre: "Actividad 2" },
  { id: "act-3", nombre: "Actividad 3" },
  { id: "act-4", nombre: "Actividad 4" },
  { id: "act-5", nombre: "Actividad 5" },
];

const FERIA = "act-feria";

function tablaDeMaria() {
  return calcularParticipaciones({
    clasesInscritas: [PROGRAMACION_II, BASES_DE_DATOS, REDES],
    actividadesGlobales: ACTIVIDADES_GLOBALES,
    actividadIdsConAsistencia: new Set(["act-1", "act-2", "act-3"]),
    asignacionesExtra: [
      { actividadId: FERIA, claseId: REDES.id, puntos: 1 },
      { actividadId: FERIA, claseId: BASES_DE_DATOS.id, puntos: 1 },
    ],
  });
}

test("el ejemplo de Maria da exactamente la tabla de la §5", () => {
  const tabla = tablaDeMaria();
  const porId = new Map(tabla.filas.map((f) => [f.claseId, f]));

  assert.deepEqual(porId.get(PROGRAMACION_II.id)?.marcas, {
    "act-1": 1,
    "act-2": 1,
    "act-3": 1,
    "act-4": 0,
    "act-5": 0,
  });
  assert.equal(porId.get(PROGRAMACION_II.id)?.extra, 0);
  assert.equal(porId.get(PROGRAMACION_II.id)?.total, 3);

  assert.equal(porId.get(BASES_DE_DATOS.id)?.extra, 1);
  assert.equal(porId.get(BASES_DE_DATOS.id)?.total, 4);

  assert.equal(porId.get(REDES.id)?.extra, 1);
  assert.equal(porId.get(REDES.id)?.total, 4);
});

test("un alumno sin inscripciones no tiene filas", () => {
  const tabla = calcularParticipaciones({
    clasesInscritas: [],
    actividadesGlobales: ACTIVIDADES_GLOBALES,
    actividadIdsConAsistencia: new Set(["act-1"]),
    asignacionesExtra: [],
  });
  assert.deepEqual(tabla.filas, []);
});

test("una clase agregada despues de la actividad recibe el punto igual", () => {
  // No hay nocion de tiempo en el calculo: toma la inscripcion vigente tal cual llega, sin
  // importar si existia cuando se marco la asistencia (§5: sin fecha de corte de inscripcion).
  const claseNueva: ClaseInscrita = { id: "clase-nueva", codigo: "NEW", nombre: "Curso nuevo" };
  const tabla = calcularParticipaciones({
    clasesInscritas: [claseNueva],
    actividadesGlobales: ACTIVIDADES_GLOBALES,
    actividadIdsConAsistencia: new Set(["act-1", "act-2", "act-3"]),
    asignacionesExtra: [],
  });
  assert.equal(tabla.filas[0]?.total, 3);
});

test("una actividad sin asistencia del alumno no suma", () => {
  const tabla = calcularParticipaciones({
    clasesInscritas: [PROGRAMACION_II],
    actividadesGlobales: ACTIVIDADES_GLOBALES,
    actividadIdsConAsistencia: new Set(),
    asignacionesExtra: [],
  });
  assert.equal(tabla.filas[0]?.total, 0);
  assert.ok(Object.values(tabla.filas[0]?.marcas ?? {}).every((m) => m === 0));
});

// ---- Saldo de puntos extra ----------------------------------------------------------------

test("el saldo es lo ganado menos lo repartido", () => {
  const saldo = calcularSaldoExtra({
    asistenciasExtra: [{ actividadId: FERIA, puntos: 2 }],
    asignacionesExtra: [],
  });
  assert.equal(saldo, 2);

  const saldoRepartido = calcularSaldoExtra({
    asistenciasExtra: [{ actividadId: FERIA, puntos: 2 }],
    asignacionesExtra: [
      { actividadId: FERIA, claseId: REDES.id, puntos: 1 },
      { actividadId: FERIA, claseId: BASES_DE_DATOS.id, puntos: 1 },
    ],
  });
  assert.equal(saldoRepartido, 0);
});

test("el saldo se desglosa por actividad de origen, mas antigua primero", () => {
  const desglose = calcularSaldoPorActividad({
    asistenciasExtra: [
      { actividadId: "act-extra-1", puntos: 2 },
      { actividadId: "act-extra-2", puntos: 2 },
    ],
    asignacionesExtra: [{ actividadId: "act-extra-1", claseId: REDES.id, puntos: 1 }],
  });
  assert.deepEqual(desglose, [
    { actividadId: "act-extra-1", disponible: 1 },
    { actividadId: "act-extra-2", disponible: 2 },
  ]);
});

test("distribuir consume primero la actividad mas antigua y sigue con la siguiente", () => {
  const distribucion = distribuirEntreActividadesExtra({
    puntos: 3,
    saldosPorActividad: [
      { actividadId: "act-extra-1", disponible: 1 },
      { actividadId: "act-extra-2", disponible: 2 },
    ],
  });
  assert.deepEqual(distribucion, [
    { actividadId: "act-extra-1", puntos: 1 },
    { actividadId: "act-extra-2", puntos: 2 },
  ]);
});

test("distribuir salta las actividades ya agotadas", () => {
  const distribucion = distribuirEntreActividadesExtra({
    puntos: 1,
    saldosPorActividad: [
      { actividadId: "act-extra-1", disponible: 0 },
      { actividadId: "act-extra-2", disponible: 1 },
    ],
  });
  assert.deepEqual(distribucion, [{ actividadId: "act-extra-2", puntos: 1 }]);
});

test("un reparto valido exige clase inscrita, entero positivo y no superar el saldo", () => {
  assert.equal(esRepartoValido({ puntos: 1, saldoDisponible: 2, claseInscrita: true }), true);
  assert.equal(esRepartoValido({ puntos: 3, saldoDisponible: 2, claseInscrita: true }), false);
  assert.equal(esRepartoValido({ puntos: 1, saldoDisponible: 2, claseInscrita: false }), false);
  assert.equal(esRepartoValido({ puntos: 0, saldoDisponible: 2, claseInscrita: true }), false);
  assert.equal(esRepartoValido({ puntos: -1, saldoDisponible: 2, claseInscrita: true }), false);
  assert.equal(esRepartoValido({ puntos: 1.5, saldoDisponible: 2, claseInscrita: true }), false);
});

// ---- Fecha de corte ------------------------------------------------------------------------

test("sin actividades publicadas todavia, no hay corte y el reparto sigue abierto", () => {
  assert.equal(calcularFechaDeCorte(null), null);
  assert.equal(repartoSigueAbierto(new Date(), null), true);
  assert.equal(avisoEsUrgente(new Date(), null), false);
});

test("el corte cae 48 horas despues del cierre de marcaje de la ultima actividad", () => {
  const cierre = new Date("2026-09-05T18:00:00.000Z");
  const corte = calcularFechaDeCorte(cierre);
  assert.equal(corte?.toISOString(), "2026-09-07T18:00:00.000Z");
});

test("el reparto se cierra justo al llegar al corte, no antes ni despues", () => {
  const cierre = new Date("2026-09-05T18:00:00.000Z");
  const corte = calcularFechaDeCorte(cierre)!;
  assert.equal(repartoSigueAbierto(new Date(corte.getTime() - 1000), corte), true);
  assert.equal(repartoSigueAbierto(corte, corte), false);
  assert.equal(repartoSigueAbierto(new Date(corte.getTime() + 1000), corte), false);
});

test("el aviso se vuelve urgente en las ultimas 24 horas antes del corte", () => {
  const cierre = new Date("2026-09-05T18:00:00.000Z");
  const corte = calcularFechaDeCorte(cierre)!;
  const veinticincoHorasAntes = new Date(corte.getTime() - 25 * 60 * 60 * 1000);
  const veintitresHorasAntes = new Date(corte.getTime() - 23 * 60 * 60 * 1000);
  assert.equal(avisoEsUrgente(veinticincoHorasAntes, corte), false);
  assert.equal(avisoEsUrgente(veintitresHorasAntes, corte), true);
  assert.equal(avisoEsUrgente(new Date(corte.getTime() + 1000), corte), false);
});
