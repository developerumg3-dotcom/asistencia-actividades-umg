"use server";

import { revalidatePath } from "next/cache";
import { deshacerAsignacion, repartirPuntos, type ResultadoReparto } from "@/lib/puntos/consulta";
import { requireAlumno } from "@/lib/sesion";

/** El saldo se ve en Puntos (/inicio) y se reparte en Extra (/puntos-extra): revalida las dos. */
function revalidarPantallasDePuntos() {
  revalidatePath("/inicio");
  revalidatePath("/puntos-extra");
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
