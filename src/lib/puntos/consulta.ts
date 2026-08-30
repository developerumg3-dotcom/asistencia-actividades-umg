import { and, asc, eq, inArray, max, sql } from "drizzle-orm";
import { db } from "@/db/cliente";
import { actividad, asignacionExtra, asistencia, clase, inscripcion } from "@/db/esquema";
import {
  calcularFechaDeCorte,
  calcularParticipaciones,
  calcularSaldoPorActividad,
  distribuirEntreActividadesExtra,
  esRepartoValido,
  repartoSigueAbierto,
  type TablaParticipaciones,
} from "./calculo";

/**
 * Una actividad en `borrador` no es visible para el alumno todavia (§4): ni suma puntos, ni
 * cuenta para la fecha de corte del reparto.
 */
const ESTADOS_VISIBLES = ["publicada", "cerrada"] as const;

async function clasesInscritasDe(alumnoId: string) {
  return db
    .select({ id: clase.id, codigo: clase.codigo, nombre: clase.nombre })
    .from(inscripcion)
    .innerJoin(clase, eq(inscripcion.claseId, clase.id))
    .where(eq(inscripcion.alumnoId, alumnoId))
    .orderBy(asc(clase.codigo));
}

export async function obtenerParticipaciones(alumnoId: string): Promise<TablaParticipaciones> {
  const [clasesInscritas, actividadesGlobales, asistenciasDelAlumno, asignaciones] = await Promise.all([
    clasesInscritasDe(alumnoId),
    db
      .select({ id: actividad.id, nombre: actividad.nombre })
      .from(actividad)
      .where(and(eq(actividad.tipo, "global"), inArray(actividad.estado, ESTADOS_VISIBLES)))
      .orderBy(asc(actividad.iniciaEn)),
    db
      .select({ actividadId: asistencia.actividadId })
      .from(asistencia)
      .where(eq(asistencia.alumnoId, alumnoId)),
    db
      .select({ actividadId: asignacionExtra.actividadId, claseId: asignacionExtra.claseId, puntos: asignacionExtra.puntos })
      .from(asignacionExtra)
      .where(eq(asignacionExtra.alumnoId, alumnoId)),
  ]);

  return calcularParticipaciones({
    clasesInscritas,
    actividadesGlobales,
    actividadIdsConAsistencia: new Set(asistenciasDelAlumno.map((a) => a.actividadId)),
    asignacionesExtra: asignaciones,
  });
}

/** `null` si todavia no hay ninguna actividad publicada o cerrada: no hay nada que cortar. */
async function fechaDeCorteVigente(): Promise<Date | null> {
  const [fila] = await db
    .select({ maxCierre: max(actividad.marcajeCierraEn) })
    .from(actividad)
    .where(inArray(actividad.estado, ESTADOS_VISIBLES));
  const maxCierre = fila?.maxCierre;
  return calcularFechaDeCorte(maxCierre ? new Date(maxCierre) : null);
}

async function asistenciasExtraDe(alumnoId: string) {
  return db
    .select({ actividadId: asistencia.actividadId, puntos: actividad.puntos, iniciaEn: actividad.iniciaEn })
    .from(asistencia)
    .innerJoin(actividad, eq(asistencia.actividadId, actividad.id))
    .where(and(eq(asistencia.alumnoId, alumnoId), eq(actividad.tipo, "extra")))
    .orderBy(asc(actividad.iniciaEn));
}

export type AsignacionExtraVisible = {
  id: string;
  claseId: string;
  claseNombre: string;
  puntos: number;
  creadaEn: Date;
};

export type EstadoPuntosExtra = {
  saldoDisponible: number;
  asignaciones: AsignacionExtraVisible[];
  clasesParaRepartir: { id: string; codigo: string; nombre: string }[];
  fechaDeCorte: Date | null;
  repartoAbierto: boolean;
};

export async function obtenerEstadoPuntosExtra(alumnoId: string): Promise<EstadoPuntosExtra> {
  const [clasesInscritas, asistenciasExtra, asignaciones, fechaDeCorte] = await Promise.all([
    clasesInscritasDe(alumnoId),
    asistenciasExtraDe(alumnoId),
    db
      .select({
        id: asignacionExtra.id,
        actividadId: asignacionExtra.actividadId,
        claseId: asignacionExtra.claseId,
        claseNombre: clase.nombre,
        puntos: asignacionExtra.puntos,
        creadaEn: asignacionExtra.creadaEn,
      })
      .from(asignacionExtra)
      .innerJoin(clase, eq(asignacionExtra.claseId, clase.id))
      .where(eq(asignacionExtra.alumnoId, alumnoId))
      .orderBy(asc(asignacionExtra.creadaEn)),
    fechaDeCorteVigente(),
  ]);

  const saldoDisponible = calcularSaldoPorActividad({ asistenciasExtra, asignacionesExtra: asignaciones }).reduce(
    (suma, s) => suma + s.disponible,
    0,
  );

  return {
    saldoDisponible,
    asignaciones,
    clasesParaRepartir: clasesInscritas,
    fechaDeCorte,
    repartoAbierto: repartoSigueAbierto(new Date(), fechaDeCorte),
  };
}

export type ResultadoReparto = { ok: true } | { ok: false; error: string };

/**
 * Reparte `puntos` del saldo del alumno hacia `claseId`.
 *
 * `neon-http` (el driver que usa esta app, ver ESTRUCTURA.md) no soporta transacciones
 * interactivas — `db.transaction()` tira "No transactions support in neon-http driver". La
 * regla de la §5 ("la suma de asignaciones nunca supera el saldo, validado en base de
 * datos") se cumple con un `INSERT ... SELECT ... WHERE` por actividad de origen: el chequeo
 * del saldo y la insercion son la misma sentencia SQL, atomica de por si. Para que dos
 * repartos que llegan de verdad al mismo tiempo tampoco se pisen, la sentencia toma antes un
 * `pg_advisory_xact_lock` sobre (alumno, actividad de origen): el segundo espera a que el
 * primero termine su propia sentencia (que Postgres ya envuelve en una transaccion implicita)
 * y recien entonces lee el saldo, ya actualizado.
 */
export async function repartirPuntos(
  alumnoId: string,
  claseId: string,
  puntos: number,
): Promise<ResultadoReparto> {
  const [inscrita] = await db
    .select({ id: inscripcion.id })
    .from(inscripcion)
    .where(and(eq(inscripcion.alumnoId, alumnoId), eq(inscripcion.claseId, claseId)))
    .limit(1);
  if (!inscrita) return { ok: false, error: "Ya no estás inscrito en esa clase." };

  const [asistenciasExtra, asignaciones, fechaDeCorte] = await Promise.all([
    asistenciasExtraDe(alumnoId),
    db
      .select({ actividadId: asignacionExtra.actividadId, puntos: asignacionExtra.puntos })
      .from(asignacionExtra)
      .where(eq(asignacionExtra.alumnoId, alumnoId)),
    fechaDeCorteVigente(),
  ]);

  if (!repartoSigueAbierto(new Date(), fechaDeCorte)) {
    return { ok: false, error: "Ya pasó la fecha de corte para repartir puntos extra." };
  }

  const saldosPorActividad = calcularSaldoPorActividad({ asistenciasExtra, asignacionesExtra: asignaciones });
  const saldoDisponible = saldosPorActividad.reduce((suma, s) => suma + s.disponible, 0);

  if (!esRepartoValido({ puntos, saldoDisponible, claseInscrita: true })) {
    return { ok: false, error: "No tenés suficiente saldo para repartir esa cantidad." };
  }

  const distribucion = distribuirEntreActividadesExtra({ puntos, saldosPorActividad });

  // Una fila por actividad de origen, cada una con su propio chequeo atomico contra el
  // saldo real de esa actividad en este momento (no el snapshot que se leyo arriba).
  for (const { actividadId, puntos: puntosDeEsaActividad } of distribucion) {
    const resultado = await db.execute(sql`
      with candado as (
        select pg_advisory_xact_lock(hashtext(${alumnoId}), hashtext(${actividadId}))
      )
      insert into asignacion_extra (alumno_id, actividad_id, clase_id, puntos)
      select ${alumnoId}, ${actividadId}, ${claseId}, ${puntosDeEsaActividad}
      from candado
      where ${puntosDeEsaActividad} <= (
        select coalesce(sum(a.puntos), 0) - coalesce((
          select sum(ae.puntos) from asignacion_extra ae
          where ae.alumno_id = ${alumnoId} and ae.actividad_id = ${actividadId}
        ), 0)
        from asistencia s
        join actividad a on a.id = s.actividad_id
        where s.alumno_id = ${alumnoId} and s.actividad_id = ${actividadId} and a.tipo = 'extra'
      )
      returning id
    `);
    if (resultado.rows.length === 0) {
      return { ok: false, error: "El saldo cambió mientras repartías. Revisá el total y volvé a intentar." };
    }
  }

  return { ok: true };
}

export async function deshacerAsignacion(alumnoId: string, asignacionId: string): Promise<ResultadoReparto> {
  const fechaDeCorte = await fechaDeCorteVigente();
  if (!repartoSigueAbierto(new Date(), fechaDeCorte)) {
    return { ok: false, error: "Ya pasó la fecha de corte: este reparto quedó congelado." };
  }
  const eliminadas = await db
    .delete(asignacionExtra)
    .where(and(eq(asignacionExtra.id, asignacionId), eq(asignacionExtra.alumnoId, alumnoId)))
    .returning({ id: asignacionExtra.id });
  if (eliminadas.length === 0) return { ok: false, error: "No se encontró ese reparto." };
  return { ok: true };
}
