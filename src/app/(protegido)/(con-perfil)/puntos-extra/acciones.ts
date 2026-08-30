"use server";

import { revalidatePath } from "next/cache";
import { deshacerAsignacion, repartirPuntos, type ResultadoReparto } from "@/lib/puntos/consulta";
import { requireAlumno } from "@/lib/sesion";

export async function repartir(claseId: string, puntos: number): Promise<ResultadoReparto> {
  const alumnoActual = await requireAlumno();
  const resultado = await repartirPuntos(alumnoActual.id, claseId, puntos);
  if (resultado.ok) revalidatePath("/puntos-extra");
  return resultado;
}

export async function deshacer(asignacionId: string): Promise<ResultadoReparto> {
  const alumnoActual = await requireAlumno();
  const resultado = await deshacerAsignacion(alumnoActual.id, asignacionId);
  if (resultado.ok) revalidatePath("/puntos-extra");
  return resultado;
}
