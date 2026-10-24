import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/cliente";
import { actividad, asistencia } from "@/db/esquema";
import { cierreFinal, faseVigente, type FaseMarcaje } from "@/lib/qr/fase";

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
  /** Doble marcaje (PLANIFICACION.md §6.5): el punto exige entrada y salida. */
  dobleMarcaje: boolean;
  salidaAbreEn: Date | null;
  salidaCierraEn: Date | null;
  /** Cuando marco la entrada (o el unico marcaje), si es que lo marco. */
  marcadaEn: Date | null;
  /** Cuando marco la salida. Solo existe con doble marcaje. */
  salidaEn: Date | null;
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
      dobleMarcaje: actividad.dobleMarcaje,
      salidaAbreEn: actividad.salidaAbreEn,
      salidaCierraEn: actividad.salidaCierraEn,
      marcadaEn: asistencia.marcadaEn,
      salidaEn: asistencia.salidaEn,
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

/** Que se puede marcar ahora, si algo. Una actividad cerrada a mano nunca acepta marcaje. */
export function faseAbierta(a: ActividadDelAlumno, ahora: Date): FaseMarcaje | null {
  return a.estado === "publicada" ? faseVigente(a, ahora) : null;
}

/** Si el marcaje esta abierto en este momento (entrada o salida). */
export function marcajeAbierto(a: ActividadDelAlumno, ahora: Date): boolean {
  return faseAbierta(a, ahora) !== null;
}

/** Si a este alumno le toca marcar ahora: la entrada si no la tiene, la salida si ya entro. */
export function lePuedeTocarMarcar(a: ActividadDelAlumno, ahora: Date): boolean {
  const fase = faseAbierta(a, ahora);
  if (fase === "entrada") return a.marcadaEn === null;
  if (fase === "salida") return a.marcadaEn !== null && a.salidaEn === null;
  return false;
}

/**
 * Si la asistencia da el punto: la de un solo marcaje con tenerla basta; la de doble marcaje
 * exige tambien la salida (PLANIFICACION.md §5 y §6.5). Con solo la entrada no hay punto.
 */
export function asistenciaCompleta(a: ActividadDelAlumno): boolean {
  return a.marcadaEn !== null && (!a.dobleMarcaje || a.salidaEn !== null);
}

/** Si ya no se va a aceptar ningun marcaje mas (la salida es el ultimo, si la hay). */
export function marcajeTerminado(a: ActividadDelAlumno, ahora: Date): boolean {
  return a.estado === "cerrada" || cierreFinal(a) < ahora;
}
