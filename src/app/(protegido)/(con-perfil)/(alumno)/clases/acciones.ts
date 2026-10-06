"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/cliente";
import { bitacora, inscripcion } from "@/db/esquema";
import { requireAlumno } from "@/lib/sesion";
import { consultaInscripcionActiva, esIdDeClase } from "@/lib/inscripciones/consulta";

export async function inscribirse(claseId: string): Promise<{ error: string | null }> {
  const alumnoActual = await requireAlumno();
  if (!esIdDeClase(claseId)) return { error: "Elegí un curso de la lista." };
  const resultado = await db.execute<{ disponible: boolean }>(consultaInscripcionActiva(alumnoActual.id, claseId));
  if (!resultado.rows[0]?.disponible) {
    return { error: "Ese curso ya no está disponible. Actualizá la lista." };
  }
  revalidatePath("/clases");
  return { error: null };
}

export async function desinscribirse(claseId: string): Promise<void> {
  const alumnoActual = await requireAlumno();
  await db
    .delete(inscripcion)
    .where(and(eq(inscripcion.alumnoId, alumnoActual.id), eq(inscripcion.claseId, claseId)));
  // Quitar una clase deja constancia en bitácora (PLANIFICACION.md §4).
  await db.insert(bitacora).values({ alumnoId: alumnoActual.id, evento: "inscripcion_eliminada" });
  revalidatePath("/clases");
}
