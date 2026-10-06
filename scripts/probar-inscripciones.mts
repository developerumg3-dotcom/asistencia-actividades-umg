import assert from "node:assert/strict";
import { test } from "node:test";
import { PgDialect } from "drizzle-orm/pg-core";
import { consultaInscripcionActiva, esIdDeClase } from "../src/lib/inscripciones/consulta.ts";

test("ids de clase malformados no llegan al cast UUID", () => {
  for (const valor of [null, undefined, 3, {}, "", "1", "x' OR true --", "00000000-0000-0000-0000-00000000000z"]) {
    assert.equal(esIdDeClase(valor), false);
  }
  assert.equal(esIdDeClase("1c6f3a59-5a24-4d25-baa4-756a7c249daa"), true);
});

test("la escritura mantiene alumno de sesion como parametro y bloquea la clase elegida", () => {
  const alumno = "auth-texto' --";
  const id = "1c6f3a59-5a24-4d25-baa4-756a7c249daa";
  const consulta = new PgDialect().sqlToQuery(consultaInscripcionActiva(alumno, id));
  assert.deepEqual(consulta.params, [id, alumno]);
  assert.ok(!consulta.sql.includes(alumno));
  assert.match(consulta.sql, /activa = true FOR SHARE/);
  assert.match(consulta.sql, /SELECT \$2, id FROM elegida/);
  assert.match(consulta.sql, /ON CONFLICT \(alumno_id, clase_id\) DO NOTHING/);
});
