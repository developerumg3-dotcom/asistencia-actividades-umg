"use server";

import { revalidatePath } from "next/cache";
import { registrarMarcajeManual } from "@/lib/qr/marcaje";
import { requireAdmin } from "@/lib/sesion";

export type EstadoFormulario = { error: string | null; mensaje?: string | null };

const MENSAJE_POR_RESULTADO: Record<string, string> = {
  no_encontrado: "No encontramos ningún alumno con ese carné o correo.",
  sin_perfil: "Ese alumno todavía no completó su carné y nombre.",
  actividad_no_encontrada: "Esta actividad ya no existe.",
};

export async function marcarAsistenciaManual(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await requireAdmin();

  const actividadId = String(formData.get("actividadId") ?? "");
  const identificadorAlumno = String(formData.get("identificadorAlumno") ?? "").trim();
  const justificacion = String(formData.get("justificacion") ?? "").trim();

  if (!identificadorAlumno) return { error: "Ingresá el carné o el correo del alumno." };
  if (!justificacion) return { error: "La justificación es obligatoria." };

  const resultado = await registrarMarcajeManual({ actividadId, identificadorAlumno, justificacion });

  if (resultado.resultado === "duplicado") {
    return { error: "Ese alumno ya tiene asistencia registrada en esta actividad." };
  }
  if (resultado.resultado !== "ok") {
    return { error: MENSAJE_POR_RESULTADO[resultado.resultado] };
  }

  revalidatePath(`/admin/actividades/${actividadId}/en-vivo`);
  return { error: null, mensaje: "Asistencia manual registrada." };
}
