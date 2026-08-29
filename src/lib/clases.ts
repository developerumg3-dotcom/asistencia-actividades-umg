import { asc, eq } from "drizzle-orm";
import { db } from "@/db/cliente";
import { clase, docente, inscripcion } from "@/db/esquema";

export type ClaseDisponible = {
  id: string;
  codigo: string;
  nombre: string;
  seccion: string | null;
  jornada: string;
  ciclo: string;
  docenteNombre: string | null;
};

export async function obtenerClasesDisponibles(): Promise<ClaseDisponible[]> {
  return db
    .select({
      id: clase.id,
      codigo: clase.codigo,
      nombre: clase.nombre,
      seccion: clase.seccion,
      jornada: clase.jornada,
      ciclo: clase.ciclo,
      docenteNombre: docente.nombre,
    })
    .from(clase)
    // leftJoin y no innerJoin: el catalogo del pensum se siembra sin catedratico
    // asignado (PLANIFICACION.md §4). Con innerJoin no se veria ninguna clase.
    .leftJoin(docente, eq(clase.docenteId, docente.id))
    .where(eq(clase.activa, true))
    .orderBy(asc(clase.codigo));
}

export async function obtenerIdsInscritoDe(alumnoId: string): Promise<string[]> {
  const inscripciones = await db
    .select({ claseId: inscripcion.claseId })
    .from(inscripcion)
    .where(eq(inscripcion.alumnoId, alumnoId));
  return inscripciones.map((i) => i.claseId);
}
