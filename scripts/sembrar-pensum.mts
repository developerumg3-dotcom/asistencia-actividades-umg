/*
 * Siembra el catalogo de cursos del pensum 0908 en la tabla `clase`.
 *
 *     pnpm db:sembrar
 *
 * Es idempotente: si un curso ya existe (mismo codigo y jornada) no lo duplica, asi que
 * se puede correr las veces que haga falta.
 *
 * Las clases quedan SIN catedratico y SIN seccion a proposito. Ver PLANIFICACION.md §4:
 * el catalogo existe antes de saber quien imparte cada curso. Antes de exportar el Excel
 * hay que asignar el catedratico de toda clase con alumnos inscritos.
 */
import { config } from "dotenv";
import { and, eq } from "drizzle-orm";

config({ path: ".env.local" });

const { db } = await import("../src/db/cliente.ts");
const { clase } = await import("../src/db/esquema/index.ts");
const { CURSOS_PENSUM, JORNADA_PENSUM } = await import("../src/db/datos/pensum-0908.ts");

let creadas = 0;
let existentes = 0;

for (const curso of CURSOS_PENSUM) {
  const [yaEsta] = await db
    .select({ id: clase.id })
    .from(clase)
    .where(and(eq(clase.codigo, curso.codigo), eq(clase.jornada, JORNADA_PENSUM)))
    .limit(1);

  if (yaEsta) {
    existentes++;
    continue;
  }

  await db.insert(clase).values({
    codigo: curso.codigo,
    nombre: curso.nombre,
    ciclo: curso.ciclo,
    jornada: JORNADA_PENSUM,
    docenteId: null,
    seccion: null,
  });
  creadas++;
}

console.log(`Pensum 0908: ${creadas} clases creadas, ${existentes} ya existian.`);
