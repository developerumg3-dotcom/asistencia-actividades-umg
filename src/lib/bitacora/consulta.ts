import "server-only";

import { and, desc, eq, gte, ilike, lte, or } from "drizzle-orm";
import { db } from "@/db/cliente";
import { actividad, alumno, asistencia, bitacora } from "@/db/esquema";
import type { eventoBitacoraEnum, resultadoBitacoraEnum } from "@/db/esquema";

export type EventoBitacora = (typeof eventoBitacoraEnum.enumValues)[number];
export type ResultadoBitacora = (typeof resultadoBitacoraEnum.enumValues)[number];

export type FiltrosBitacora = {
  /** Carné, nombre o correo — texto libre, igual criterio de busqueda que B7. */
  alumnoTexto?: string;
  actividadId?: string;
  evento?: EventoBitacora;
  resultado?: ResultadoBitacora;
  desde?: Date;
  hasta?: Date;
};

export type FilaBitacora = {
  id: string;
  alumnoId: string;
  alumnoNombre: string | null;
  alumnoEmail: string;
  actividadId: string | null;
  actividadNombre: string | null;
  evento: EventoBitacora;
  resultado: ResultadoBitacora | null;
  ocurrioEn: Date;
  ip: string | null;
  dispositivoId: string | null;
  detalle: string | null;
  // Solo tiene sentido cuando evento = "marcaje": la justificacion del marcaje manual (B8)
  // vive en `asistencia.nota_manual`, no en bitacora — ver docs/fase-4.md.
  notaManual: string | null;
  origenAsistencia: "qr" | "manual" | null;
};

/** Una pagina alcanza y sobra para revisar un evento puntual; la bitacora crece sin techo. */
const LIMITE_FILAS = 200;

export async function listarBitacora(filtros: FiltrosBitacora): Promise<FilaBitacora[]> {
  const condiciones = [
    filtros.alumnoTexto
      ? or(
          ilike(alumno.carne, `%${filtros.alumnoTexto}%`),
          ilike(alumno.nombre, `%${filtros.alumnoTexto}%`),
          ilike(alumno.email, `%${filtros.alumnoTexto}%`),
        )
      : undefined,
    filtros.actividadId ? eq(bitacora.actividadId, filtros.actividadId) : undefined,
    filtros.evento ? eq(bitacora.evento, filtros.evento) : undefined,
    filtros.resultado ? eq(bitacora.resultado, filtros.resultado) : undefined,
    filtros.desde ? gte(bitacora.ocurrioEn, filtros.desde) : undefined,
    filtros.hasta ? lte(bitacora.ocurrioEn, filtros.hasta) : undefined,
  ].filter((c) => c !== undefined);

  return db
    .select({
      id: bitacora.id,
      alumnoId: bitacora.alumnoId,
      alumnoNombre: alumno.nombre,
      alumnoEmail: alumno.email,
      actividadId: bitacora.actividadId,
      actividadNombre: actividad.nombre,
      evento: bitacora.evento,
      resultado: bitacora.resultado,
      ocurrioEn: bitacora.ocurrioEn,
      ip: bitacora.ip,
      dispositivoId: bitacora.dispositivoId,
      detalle: bitacora.detalle,
      notaManual: asistencia.notaManual,
      origenAsistencia: asistencia.origen,
    })
    .from(bitacora)
    .innerJoin(alumno, eq(bitacora.alumnoId, alumno.id))
    .leftJoin(actividad, eq(bitacora.actividadId, actividad.id))
    .leftJoin(
      asistencia,
      and(eq(asistencia.alumnoId, bitacora.alumnoId), eq(asistencia.actividadId, bitacora.actividadId)),
    )
    .where(condiciones.length > 0 ? and(...condiciones) : undefined)
    .orderBy(desc(bitacora.ocurrioEn))
    .limit(LIMITE_FILAS);
}

/** Lista de actividades para el filtro de B9 — nombre y fecha, sin exponer `secreto_qr`. */
export async function listarActividadesParaFiltro() {
  return db
    .select({ id: actividad.id, nombre: actividad.nombre })
    .from(actividad)
    .orderBy(desc(actividad.iniciaEn));
}
