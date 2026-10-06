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
  await db.batch([
    db.insert(inscripcion).values({ alumnoId, claseId }).onConflictDoNothing(),
    db.insert(bitacora).values({
      alumnoId,
      evento: "inscripcion_creada",
      detalle: `admin:${quienAdministra.email}`,
    }),
  ]);
  revalidatePath(`/admin/alumnos/${alumnoId}`);
}

export async function quitarInscripcionAdmin(alumnoId: string, claseId: string): Promise<void> {
  const quienAdministra = await requireAdmin();
  await db.batch([
    db.delete(inscripcion).where(and(eq(inscripcion.alumnoId, alumnoId), eq(inscripcion.claseId, claseId))),
    db.insert(bitacora).values({
      alumnoId,
      evento: "inscripcion_eliminada",
      detalle: `admin:${quienAdministra.email}`,
    }),
  ]);
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

  // `perfilCompleto` se invalida junto con el carne: el marcaje (QR y manual) y el layout
  // confian en ese booleano, no en que el carne exista. Sin esto la cuenta seguia marcando sin
  // carne. No se tocan `asistencia` ni `inscripcion`: el alumno completa el perfil y sigue.
  //
  // Las dos sentencias van en un `db.batch` (ver AGENTS.md): si la bitacora fallara por
  // separado, el carne quedaria liberado sin ningun registro de quien lo hizo — y este es
  // justamente el caso que se anota para poder investigar un conflicto de carne despues.
  await db.batch([
    db.update(alumno).set({ carne: null, perfilCompleto: false }).where(eq(alumno.id, alumnoId)),
    db.insert(bitacora).values({
      alumnoId,
      evento: "carne_liberado",
      detalle: `${afectado.carne} (admin:${quienAdministra.email})`,
    }),
  ]);

  revalidatePath(`/admin/alumnos/${alumnoId}`);
  return { error: null, mensaje: "Carné liberado. Ya lo puede usar otra cuenta, y el alumno tendrá que completar su perfil de nuevo." };
}
