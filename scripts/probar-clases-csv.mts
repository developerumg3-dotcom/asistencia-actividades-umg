/*
 * Pruebas de la interpretacion del CSV de clases: secciones sin catedratico.
 *
 *     pnpm probar
 */
import assert from "node:assert/strict";
import { test } from "node:test";

import {
  claveDeSeccion,
  columnasFaltantes,
  interpretarFilas,
  planificarImportacion,
  resumenDeImportacion,
  type ClaseExistente,
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

const resumen = (parcial: Partial<Parameters<typeof resumenDeImportacion>[0]>) =>
  resumenDeImportacion({ total: 0, creadas: 0, sinCatedratico: 0, asignadas: 0, yaExistian: 0, omitidas: [], ...parcial });

test("el resumen dice cuantas quedaron sin catedratico y por que se omitieron las demas", () => {
  const texto = resumen({ total: 4, creadas: 3, sinCatedratico: 3, omitidas: [{ fila: 5, motivo: "falta ciclo" }] });
  assert.match(texto, /Se crearon 3 de 4 filas\./);
  assert.match(texto, /3 quedaron sin catedrático/);
  assert.match(texto, /fila 5 \(falta ciclo\)/);
});

test("el resumen no detalla mas de cinco omisiones", () => {
  const omitidas = Array.from({ length: 8 }, (_, i) => ({ fila: i + 2, motivo: "falta ciclo" }));
  const texto = resumen({ total: 8, omitidas });
  assert.match(texto, /y 3 más/);
  assert.doesNotMatch(texto, /fila 9/);
});

test("el resumen cuenta las que ya existian y las que recibieron catedratico", () => {
  const texto = resumen({ total: 5, yaExistian: 3, asignadas: 2 });
  assert.match(texto, /3 ya existían y no se duplicaron/);
  assert.match(texto, /A 2 secciones que ya existían se les asignó su catedrático/);
});

// ---- Duplicados ----------------------------------------------------------------------------

const seccionA = (extra: Partial<ClaseExistente> = {}): ClaseExistente => ({
  id: "clase-a",
  codigo: "046",
  seccion: "A",
  jornada: "Sábado",
  emailCatedratico: null,
  ...extra,
});

const validasDe = (...filas: Record<string, string>[]) => interpretarFilas(filas).validas;

test("la clave de seccion ignora mayusculas y espacios de los bordes", () => {
  assert.equal(
    claveDeSeccion({ codigo: " 046 ", seccion: "a", jornada: "sábado" }),
    claveDeSeccion({ codigo: "046", seccion: " A ", jornada: "Sábado" }),
  );
});

test("CARGAR DOS VECES EL MISMO ARCHIVO NO DUPLICA: la seccion existente se salta", () => {
  const plan = planificarImportacion(validasDe(base), [seccionA()]);
  assert.equal(plan.crear.length, 0);
  assert.equal(plan.yaExistian, 1);
  assert.equal(plan.omitidas.length, 0);
});

test("una seccion nueva se crea", () => {
  const plan = planificarImportacion(validasDe({ ...base, seccion: "B" }), [seccionA()]);
  assert.equal(plan.crear.length, 1);
  assert.equal(plan.crear[0].seccion, "B");
});

test("la misma seccion en otra jornada es otra seccion", () => {
  const plan = planificarImportacion(validasDe({ ...base, jornada: "Domingo" }), [seccionA()]);
  assert.equal(plan.crear.length, 1);
});

test("la fila base del pensum (sin seccion) no se confunde con una seccion", () => {
  const plan = planificarImportacion(validasDe(base), [seccionA({ seccion: null })]);
  assert.equal(plan.crear.length, 1, "la seccion A se crea aparte del catalogo base");
});

test("una fila repetida dentro del mismo archivo se crea una sola vez", () => {
  const plan = planificarImportacion(validasDe(base, { ...base, seccion: " a " }), []);
  assert.equal(plan.crear.length, 1);
  assert.deepEqual(plan.omitidas, [{ fila: 3, motivo: "repetida dentro del mismo archivo" }]);
});

test("una seccion existente SIN catedratico recibe el que trae el archivo, sin duplicarse", () => {
  const plan = planificarImportacion(
    validasDe({ ...base, docente_nombre: "Ana López", docente_email: "ana@miumg.edu.gt" }),
    [seccionA()],
  );
  assert.equal(plan.crear.length, 0);
  assert.equal(plan.asignar.length, 1);
  assert.equal(plan.asignar[0].claseId, "clase-a");
});

test("una seccion con OTRO catedratico no se pisa: se omite y se dice por que", () => {
  const plan = planificarImportacion(
    validasDe({ ...base, docente_nombre: "Ana López", docente_email: "ana@miumg.edu.gt" }),
    [seccionA({ emailCatedratico: "otro@miumg.edu.gt" })],
  );
  assert.equal(plan.asignar.length, 0);
  assert.equal(plan.crear.length, 0);
  assert.match(plan.omitidas[0].motivo, /ya tiene otro catedrático/);
});

test("el mismo catedratico, aunque cambien las mayusculas del correo, cuenta como ya existente", () => {
  const plan = planificarImportacion(
    validasDe({ ...base, docente_nombre: "Ana López", docente_email: "ANA@miumg.edu.gt" }),
    [seccionA({ emailCatedratico: "ana@miumg.edu.gt" })],
  );
  assert.equal(plan.yaExistian, 1);
  assert.equal(plan.omitidas.length, 0);
});

test("una seccion existente con catedratico y fila sin el no lo borra", () => {
  const plan = planificarImportacion(validasDe(base), [seccionA({ emailCatedratico: "ana@miumg.edu.gt" })]);
  assert.equal(plan.yaExistian, 1);
  assert.equal(plan.asignar.length, 0);
});
