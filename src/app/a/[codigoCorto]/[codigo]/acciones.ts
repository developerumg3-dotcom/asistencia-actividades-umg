"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { mensajeDe, registrarMarcaje, type Marcaje } from "@/lib/qr/marcaje";
import { horaEnGuatemala } from "@/lib/fechas";
import { obtenerAlumnoActual } from "@/lib/sesion";

export type EstadoMarcaje = {
  resultado: Marcaje["resultado"] | "sin_sesion" | null;
  mensaje: string | null;
};

export const estadoInicialMarcaje: EstadoMarcaje = { resultado: null, mensaje: null };

export async function marcarAsistencia(
  _estadoPrevio: EstadoMarcaje,
  formData: FormData,
): Promise<EstadoMarcaje> {
  const alumnoActual = await obtenerAlumnoActual();
  if (!alumnoActual) {
    return { resultado: "sin_sesion", mensaje: "Iniciá sesión para marcar." };
  }

  const codigoCorto = String(formData.get("codigoCorto") ?? "");
  const codigo = String(formData.get("codigo") ?? "");

  // Etapa 1 de la geolocalizacion: viaja si el telefono la dio a tiempo, y si no, no. No
  // condiciona el marcaje (docs/plan-geolocalizacion.md).
  const lat = Number(formData.get("lat"));
  const lon = Number(formData.get("lon"));
  const precision = Number(formData.get("precisionM"));
  const ubicacion =
    Number.isFinite(lat) && Number.isFinite(lon) && formData.has("lat")
      ? { lat, lon, precisionM: Number.isFinite(precision) ? precision : null }
      : null;

  const cabeceras = await headers();

  const marcaje = await registrarMarcaje({
    alumno: alumnoActual,
    codigoCorto,
    codigo,
    // La hora en que llega el boton, no la del escaneo: es lo que vuelve inutil compartir
    // la foto del QR (PLANIFICACION.md §6.2).
    momento: new Date(),
    datos: {
      // Bitacora, nunca criterio: todo el campus sale por la misma IP (§7).
      ip: cabeceras.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      dispositivoId: null,
    },
    ubicacion,
  });

  revalidatePath("/inicio");

  const hora = "marcadaEn" in marcaje ? horaEnGuatemala(marcaje.marcadaEn) : undefined;
  return { resultado: marcaje.resultado, mensaje: mensajeDe(marcaje, hora) };
}
