"use server";

import { revalidatePath } from "next/cache";
import { deshacerAsignacion, repartirPuntos, type ResultadoReparto } from "@/lib/puntos/consulta";
import { requireAlumno } from "@/lib/sesion";

/** Se llama tanto desde /inicio como desde /admin/mis-puntos: revalida las dos. */
function revalidarPantallasDePuntos() {
  revalidatePath("/inicio");
  revalidatePath("/admin/mis-puntos");
}

export async function repartir(claseId: string, puntos: number): Promise<ResultadoReparto> {
  const alumnoActual = await requireAlumno();
  const resultado = await repartirPuntos(alumnoActual.id, claseId, puntos);
  if (resultado.ok) revalidarPantallasDePuntos();
  return resultado;
}

export async function deshacer(asignacionId: string): Promise<ResultadoReparto> {
  const alumnoActual = await requireAlumno();
  const resultado = await deshacerAsignacion(alumnoActual.id, asignacionId);
  if (resultado.ok) revalidarPantallasDePuntos();
  return resultado;
}
