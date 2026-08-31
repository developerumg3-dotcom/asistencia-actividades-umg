/*
 * Pruebas de las señales raras de la bitácora (B9 — Fase 4): resaltado, nunca acción
 * automática. Ver docs/fase-4.md.
 *
 *     pnpm probar
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { detectarSenales, type EventoParaSenal } from "../src/lib/bitacora/senales.ts";

function evento(parcial: Partial<EventoParaSenal> & { id: string }): EventoParaSenal {
  return {
    alumnoId: "a-1",
    dispositivoId: null,
    resultado: "invalido",
    ocurrioEn: new Date("2026-08-30T10:00:00Z"),
    ...parcial,
  };
}

test("5 fallos del mismo alumno en 10 minutos se marcan como señal", () => {
  const base = new Date("2026-08-30T10:00:00Z").getTime();
  const eventos = Array.from({ length: 5 }, (_, i) =>
    evento({ id: `e-${i}`, ocurrioEn: new Date(base + i * 60_000) }),
  );

  const { porIntentosFallidos } = detectarSenales(eventos);
  assert.equal(porIntentosFallidos.size, 5);
});

test("4 fallos no llegan al umbral", () => {
  const base = new Date("2026-08-30T10:00:00Z").getTime();
  const eventos = Array.from({ length: 4 }, (_, i) =>
    evento({ id: `e-${i}`, ocurrioEn: new Date(base + i * 60_000) }),
  );

  const { porIntentosFallidos } = detectarSenales(eventos);
  assert.equal(porIntentosFallidos.size, 0);
});

test("5 fallos repartidos en más de 10 minutos no se marcan", () => {
  const base = new Date("2026-08-30T10:00:00Z").getTime();
  const eventos = Array.from({ length: 5 }, (_, i) =>
    evento({ id: `e-${i}`, ocurrioEn: new Date(base + i * 5 * 60_000) }),
  );

  const { porIntentosFallidos } = detectarSenales(eventos);
  assert.equal(porIntentosFallidos.size, 0);
});

test("un resultado 'ok' no cuenta como fallo", () => {
  const base = new Date("2026-08-30T10:00:00Z").getTime();
  const eventos = [
    ...Array.from({ length: 4 }, (_, i) => evento({ id: `e-${i}`, ocurrioEn: new Date(base + i * 60_000) })),
    evento({ id: "e-ok", resultado: "ok", ocurrioEn: new Date(base + 4 * 60_000) }),
  ];

  const { porIntentosFallidos } = detectarSenales(eventos);
  assert.equal(porIntentosFallidos.size, 0);
});

test("un mismo dispositivo detrás de 2 alumnos distintos se marca", () => {
  const eventos = [
    evento({ id: "e-1", alumnoId: "a-1", dispositivoId: "disp-1" }),
    evento({ id: "e-2", alumnoId: "a-2", dispositivoId: "disp-1" }),
  ];

  const { porDispositivoCompartido } = detectarSenales(eventos);
  assert.equal(porDispositivoCompartido.size, 2);
});

test("un mismo dispositivo con un solo alumno no se marca", () => {
  const eventos = [
    evento({ id: "e-1", alumnoId: "a-1", dispositivoId: "disp-1" }),
    evento({ id: "e-2", alumnoId: "a-1", dispositivoId: "disp-1" }),
  ];

  const { porDispositivoCompartido } = detectarSenales(eventos);
  assert.equal(porDispositivoCompartido.size, 0);
});
