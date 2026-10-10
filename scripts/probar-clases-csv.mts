/*
 * Pruebas de la interpretacion del CSV de clases: secciones sin catedratico.
 *
 *     pnpm probar
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  columnasFaltantes,
  interpretarFilas,
  resumenDeImportacion,
} from "../src/lib/clases-csv.ts";

const base = { codigo: "046", nombre: "TELECOMUNICACIONES", seccion: "A", jornada: "Sábado", ciclo: "9" };

test("la cabecera sin columnas del catedratico es valida", () => {
  assert.deepEqual(columnasFaltantes(["codigo", "nombre", "seccion", "jornada", "ciclo"]), []);
});

test("la cabecera sin una columna obligatoria se rechaza y la nombra", () => {
  assert.deepEqual(columnasFaltantes(["codigo", "nombre", "jornada", "ciclo"]), ["seccion"]);
});

test("una seccion sin catedratico se crea, con el catedratico en null", () => {
  const { validas, omitidas } = interpretarFilas([{ ...base, docente_nombre: "", docente_email: "" }]);
  assert.equal(omitidas.length, 0);
  assert.equal(validas.length, 1);
  assert.equal(validas[0].catedratico, null);
  assert.equal(validas[0].seccion, "A");
});

test("sin las columnas del catedratico tambien se crea", () => {
  const { validas, omitidas } = interpretarFilas([base]);
  assert.equal(omitidas.length, 0);
  assert.equal(validas[0].catedratico, null);
});

test("con catedratico completo, se conserva", () => {
  const { validas } = interpretarFilas([
    { ...base, docente_nombre: " Ana López ", docente_email: " ana@miumg.edu.gt " },
  ]);
  assert.deepEqual(validas[0].catedratico, { nombre: "Ana López", email: "ana@miumg.edu.gt" });
});

test("nombre sin correo, o correo sin nombre, se omite con motivo", () => {
  const { validas, omitidas } = interpretarFilas([
    { ...base, docente_nombre: "Ana López", docente_email: "" },
    { ...base, docente_nombre: "", docente_email: "ana@miumg.edu.gt" },
  ]);
  assert.equal(validas.length, 0);
  assert.equal(omitidas.length, 2);
  assert.match(omitidas[0].motivo, /no los dos/);
});

test("una fila sin un dato obligatorio se omite diciendo cual falta", () => {
  const { validas, omitidas } = interpretarFilas([{ ...base, seccion: "  " }]);
  assert.equal(validas.length, 0);
  assert.deepEqual(omitidas, [{ fila: 2, motivo: "falta seccion" }]);
});

test("el numero de fila es el del archivo: la cabecera es la 1", () => {
  const { omitidas } = interpretarFilas([base, base, { ...base, codigo: "" }]);
  assert.equal(omitidas[0].fila, 4);
});

test("el resumen dice cuantas quedaron sin catedratico y por que se omitieron las demas", () => {
  const texto = resumenDeImportacion(3, 4, 3, [{ fila: 5, motivo: "falta ciclo" }]);
  assert.match(texto, /Se importaron 3 de 4 filas\./);
  assert.match(texto, /3 quedaron sin catedrático/);
  assert.match(texto, /fila 5 \(falta ciclo\)/);
});

test("el resumen no detalla mas de cinco omisiones", () => {
  const omitidas = Array.from({ length: 8 }, (_, i) => ({ fila: i + 2, motivo: "falta ciclo" }));
  const texto = resumenDeImportacion(0, 8, 0, omitidas);
  assert.match(texto, /y 3 más/);
  assert.doesNotMatch(texto, /fila 9/);
});
