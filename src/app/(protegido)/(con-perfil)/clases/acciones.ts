"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/cliente";
import { bitacora, inscripcion } from "@/db/esquema";
import { requireAlumno } from "@/lib/sesion";

export async function inscribirse(claseId: string): Promise<void> {
  const alumnoActual = await requireAlumno();
  await db
    .insert(inscripcion)
    .values({ alumnoId: alumnoActual.id, claseId })
    .onConflictDoNothing();
  revalidatePath("/clases");
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
