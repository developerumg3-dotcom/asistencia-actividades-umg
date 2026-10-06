/*
 * Pruebas de la regla "ADMIN_EMAILS solo concede admin con correo verificado" (ASI2-13).
 *
 *     pnpm probar
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import { correoEsAdmin } from "../src/lib/admin-correo.ts";

const LISTA = " Jefe@miumg.edu.gt , otro@miumg.edu.gt ";

test("correo en la lista y verificado: admin, sin importar mayusculas ni espacios", () => {
  assert.equal(correoEsAdmin("jefe@miumg.edu.gt", true, LISTA), true);
  assert.equal(correoEsAdmin(" JEFE@miumg.edu.gt ", true, LISTA), true);
});

test("correo en la lista pero sin verificar: nunca admin", () => {
  assert.equal(correoEsAdmin("jefe@miumg.edu.gt", false, LISTA), false);
  assert.equal(correoEsAdmin("jefe@miumg.edu.gt", undefined, LISTA), false);
  assert.equal(correoEsAdmin("jefe@miumg.edu.gt", null, LISTA), false);
  assert.equal(correoEsAdmin("jefe@miumg.edu.gt", "true", LISTA), false);
});

test("correo verificado fuera de la lista, o lista vacia/ausente: no es admin", () => {
  assert.equal(correoEsAdmin("alumno@miumg.edu.gt", true, LISTA), false);
  assert.equal(correoEsAdmin("jefe@miumg.edu.gt", true, ""), false);
  assert.equal(correoEsAdmin("jefe@miumg.edu.gt", true, undefined), false);
});
