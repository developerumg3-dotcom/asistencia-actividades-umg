/*
 * Pruebas de la validación de datos obligatorios del perfil (ASI2-18).
 *
 *     pnpm probar
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { errorDeDatosPerfil } from "../src/lib/perfil.ts";

const completo = { carne: "0900-12-3456", nombre: "Ana Pérez", ciclo: "3", cantidadCursos: 2 };

test("datos completos pasan", () => {
  assert.equal(errorDeDatosPerfil(completo), null);
});

test("carné, nombre o ciclo vacíos o solo espacios se rechazan", () => {
  for (const campo of ["carne", "nombre", "ciclo"] as const) {
    assert.ok(errorDeDatosPerfil({ ...completo, [campo]: "   " }));
    assert.ok(errorDeDatosPerfil({ ...completo, [campo]: "" }));
  }
});

test("ciclo fuera de 1-10 se rechaza", () => {
  assert.ok(errorDeDatosPerfil({ ...completo, ciclo: "11" }));
  assert.ok(errorDeDatosPerfil({ ...completo, ciclo: "0" }));
});

test("sin cursos se rechaza", () => {
  assert.ok(errorDeDatosPerfil({ ...completo, cantidadCursos: 0 }));
});
