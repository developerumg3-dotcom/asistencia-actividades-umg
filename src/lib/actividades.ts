import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db/cliente";
import { actividad, asistencia } from "@/db/esquema";

export type ActividadDelAlumno = {
  id: string;
  nombre: string;
  lugar: string | null;
  tipo: "global" | "extra";
  puntos: number;
  iniciaEn: Date;
  terminaEn: Date;
  marcajeAbreEn: Date;
  marcajeCierraEn: Date;
  /** Cuando la marco, si es que la marco. */
  marcadaEn: Date | null;
};

/**
 * Las actividades publicadas con el estado de este alumno en cada una. Solo publicadas: un
 * borrador es trabajo interno del administrador y no tiene por que verse.
 *
 * `secreto_qr` no se selecciona, como en todas partes.
 */
export async function obtenerActividadesDelAlumno(alumnoId: string): Promise<ActividadDelAlumno[]> {
  return db
    .select({
      id: actividad.id,
      nombre: actividad.nombre,
      lugar: actividad.lugar,
      tipo: actividad.tipo,
      puntos: actividad.puntos,
      iniciaEn: actividad.iniciaEn,
      terminaEn: actividad.terminaEn,
      marcajeAbreEn: actividad.marcajeAbreEn,
      marcajeCierraEn: actividad.marcajeCierraEn,
      marcadaEn: asistencia.marcadaEn,
    })
    .from(actividad)
    .leftJoin(
      asistencia,
      and(eq(asistencia.actividadId, actividad.id), eq(asistencia.alumnoId, alumnoId)),
    )
    .where(eq(actividad.estado, "publicada"))
    .orderBy(asc(actividad.iniciaEn));
}

/** Si el marcaje esta abierto en este momento. */
export function marcajeAbierto(a: ActividadDelAlumno, ahora: Date): boolean {
  return ahora >= a.marcajeAbreEn && ahora <= a.marcajeCierraEn;
}
