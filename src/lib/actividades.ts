import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/cliente";
import { actividad, asistencia } from "@/db/esquema";

export type ActividadDelAlumno = {
  id: string;
  nombre: string;
  lugar: string | null;
  tipo: "global" | "extra";
  puntos: number;
  estado: "borrador" | "publicada" | "cerrada";
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
 * Con `incluirCerradas` trae tambien las que el administrador ya cerro: la pantalla
 * Actividades (A11) las muestra en "Ya pasaron", porque el punto que dieron sigue contando
 * (mismo criterio que `ESTADOS_VISIBLES` en lib/puntos/consulta.ts). Un borrador no sale nunca.
 *
 * `secreto_qr` no se selecciona, como en todas partes.
 */
export async function obtenerActividadesDelAlumno(
  alumnoId: string,
  opciones: { incluirCerradas?: boolean } = {},
): Promise<ActividadDelAlumno[]> {
  return db
    .select({
      id: actividad.id,
      nombre: actividad.nombre,
      lugar: actividad.lugar,
      tipo: actividad.tipo,
      puntos: actividad.puntos,
      estado: actividad.estado,
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
    .where(
      opciones.incluirCerradas
        ? inArray(actividad.estado, ["publicada", "cerrada"])
        : eq(actividad.estado, "publicada"),
    )
    .orderBy(asc(actividad.iniciaEn));
}

/** Si el marcaje esta abierto en este momento. Una actividad cerrada a mano nunca lo esta. */
export function marcajeAbierto(a: ActividadDelAlumno, ahora: Date): boolean {
  return a.estado === "publicada" && ahora >= a.marcajeAbreEn && ahora <= a.marcajeCierraEn;
}
