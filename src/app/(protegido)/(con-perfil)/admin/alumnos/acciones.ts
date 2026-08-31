"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/cliente";
import { alumno, bitacora, inscripcion } from "@/db/esquema";
import { requireAdmin } from "@/lib/sesion";

export type EstadoFormulario = { error: string | null; mensaje?: string | null };

/**
 * Corregir inscripciones desde el admin (B7). Reusa los mismos eventos de bitacora que
 * `clases/acciones.ts` (el propio alumno), pero anota en `detalle` quien de administracion lo
 * hizo — sin eso, esta fila seria indistinguible de una que dispara el propio alumno desde
 * /clases. Ver docs/fase-4.md.
 */
export async function agregarInscripcionAdmin(alumnoId: string, claseId: string): Promise<void> {
  const quienAdministra = await requireAdmin();
  await db.insert(inscripcion).values({ alumnoId, claseId }).onConflictDoNothing();
  await db.insert(bitacora).values({
    alumnoId,
    evento: "inscripcion_creada",
    detalle: `admin:${quienAdministra.email}`,
  });
  revalidatePath(`/admin/alumnos/${alumnoId}`);
}

export async function quitarInscripcionAdmin(alumnoId: string, claseId: string): Promise<void> {
  const quienAdministra = await requireAdmin();
  await db.delete(inscripcion).where(and(eq(inscripcion.alumnoId, alumnoId), eq(inscripcion.claseId, claseId)));
  await db.insert(bitacora).values({
    alumnoId,
    evento: "inscripcion_eliminada",
    detalle: `admin:${quienAdministra.email}`,
  });
  revalidatePath(`/admin/alumnos/${alumnoId}`);
}

/**
 * Libera el carné de un alumno (lo pone en NULL) para resolver el caso de borde confirmado
 * con Daniel: alguien tecleó mal su carné y otra cuenta ya se lo ganó, o quedó un carné real
 * en una cuenta de prueba. El carné liberado queda en `bitacora.detalle` por si vuelve a dar
 * conflicto y hay que investigar.
 */
export async function liberarCarne(_estadoPrevio: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const quienAdministra = await requireAdmin();
  const alumnoId = String(formData.get("alumnoId") ?? "");
  if (!alumnoId) return { error: "Falta el alumno." };

  const [afectado] = await db.select({ carne: alumno.carne }).from(alumno).where(eq(alumno.id, alumnoId)).limit(1);
  if (!afectado?.carne) return { error: "Ese alumno no tiene carné cargado." };

  await db.update(alumno).set({ carne: null }).where(eq(alumno.id, alumnoId));
  await db.insert(bitacora).values({
    alumnoId,
    evento: "carne_liberado",
    detalle: `${afectado.carne} (admin:${quienAdministra.email})`,
  });

  revalidatePath(`/admin/alumnos/${alumnoId}`);
  return { error: null, mensaje: "Carné liberado. Ya lo puede usar otra cuenta." };
}
