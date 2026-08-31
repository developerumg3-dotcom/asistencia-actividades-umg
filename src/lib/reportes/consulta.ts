import "server-only";

import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db/cliente";
import { actividad, alumno, asignacionExtra, asistencia, clase, docente, inscripcion } from "@/db/esquema";
import { calcularReporteDeClase, type ActividadGlobal, type FilaReporte } from "@/lib/puntos/calculo";

/** Igual criterio que `lib/puntos/consulta.ts`: un borrador no cuenta para nadie todavia. */
const ESTADOS_VISIBLES = ["publicada", "cerrada"] as const;

export type HojaReporte = {
  claseId: string;
  claseCodigo: string;
  claseNombre: string;
  claseSeccion: string | null;
  claseJornada: string;
  claseCiclo: string;
  docenteNombre: string;
  columnas: ActividadGlobal[];
  filas: FilaReporte[];
};

type ClaseParaHoja = {
  id: string;
  codigo: string;
  nombre: string;
  seccion: string | null;
  jornada: string;
  ciclo: string;
  docenteNombre: string;
};

async function actividadesGlobalesVisibles(): Promise<ActividadGlobal[]> {
  return db
    .select({ id: actividad.id, nombre: actividad.nombre })
    .from(actividad)
    .where(and(eq(actividad.tipo, "global"), inArray(actividad.estado, ESTADOS_VISIBLES)))
    .orderBy(asc(actividad.iniciaEn));
}

/**
 * Una hoja completa (clase + sus alumnos inscritos + sus puntos), lista para `excel.ts`.
 * Reusa `calcularReporteDeClase` — el mismo motor que alimenta A9 y B7 — con los datos de
 * esta clase puntual ya leidos de la base.
 */
async function construirHoja(claseInfo: ClaseParaHoja, actividadesGlobales: ActividadGlobal[]): Promise<HojaReporte> {
  const alumnosInscritos = await db
    .select({ id: alumno.id, carne: alumno.carne, nombre: alumno.nombre, email: alumno.email })
    .from(inscripcion)
    .innerJoin(alumno, eq(inscripcion.alumnoId, alumno.id))
    .where(eq(inscripcion.claseId, claseInfo.id));

  const alumnoIds = alumnosInscritos.map((a) => a.id);

  const [asistenciasGlobales, asignaciones] =
    alumnoIds.length === 0
      ? [[], []]
      : await Promise.all([
          db
            .select({ alumnoId: asistencia.alumnoId, actividadId: asistencia.actividadId })
            .from(asistencia)
            .innerJoin(actividad, eq(asistencia.actividadId, actividad.id))
            .where(and(inArray(asistencia.alumnoId, alumnoIds), eq(actividad.tipo, "global"))),
          db
            .select({ alumnoId: asignacionExtra.alumnoId, puntos: asignacionExtra.puntos })
            .from(asignacionExtra)
            .where(and(eq(asignacionExtra.claseId, claseInfo.id), inArray(asignacionExtra.alumnoId, alumnoIds))),
        ]);

  const asistenciasPorAlumno = new Map<string, Set<string>>();
  for (const a of asistenciasGlobales) {
    const conjunto = asistenciasPorAlumno.get(a.alumnoId);
    if (conjunto) conjunto.add(a.actividadId);
    else asistenciasPorAlumno.set(a.alumnoId, new Set([a.actividadId]));
  }

  const extraPorAlumno = new Map<string, number>();
  for (const e of asignaciones) {
    extraPorAlumno.set(e.alumnoId, (extraPorAlumno.get(e.alumnoId) ?? 0) + e.puntos);
  }

  const filas = calcularReporteDeClase({
    alumnos: alumnosInscritos,
    actividadesGlobales,
    asistenciasPorAlumno,
    extraPorAlumno,
  });

  return {
    claseId: claseInfo.id,
    claseCodigo: claseInfo.codigo,
    claseNombre: claseInfo.nombre,
    claseSeccion: claseInfo.seccion,
    claseJornada: claseInfo.jornada,
    claseCiclo: claseInfo.ciclo,
    docenteNombre: claseInfo.docenteNombre,
    columnas: actividadesGlobales,
    filas,
  };
}

export type ReporteDeDocente = { docenteNombre: string; hojas: HojaReporte[] };

/** Un libro por catedratico, una hoja por cada una de sus clases activas (§9). */
export async function obtenerReporteDeDocente(docenteId: string): Promise<ReporteDeDocente | null> {
  const [unDocente] = await db.select({ id: docente.id, nombre: docente.nombre }).from(docente).where(eq(docente.id, docenteId)).limit(1);
  if (!unDocente) return null;

  const [clasesDelDocente, actividadesGlobales] = await Promise.all([
    db
      .select({ id: clase.id, codigo: clase.codigo, nombre: clase.nombre, seccion: clase.seccion, jornada: clase.jornada, ciclo: clase.ciclo })
      .from(clase)
      .where(and(eq(clase.docenteId, docenteId), eq(clase.activa, true)))
      .orderBy(asc(clase.codigo)),
    actividadesGlobalesVisibles(),
  ]);

  const hojas = await Promise.all(
    clasesDelDocente.map((c) => construirHoja({ ...c, docenteNombre: unDocente.nombre }, actividadesGlobales)),
  );

  return { docenteNombre: unDocente.nombre, hojas };
}

export type ClaseExcluida = { id: string; codigo: string; nombre: string };
export type ReporteGlobal = { hojas: HojaReporte[]; clasesExcluidas: ClaseExcluida[] };

/**
 * Todas las clases activas con catedratico asignado, en un solo libro (§9, "o consolidado").
 * Las clases sin catedratico no se pueden agrupar en ningun libro (§8, B10): se listan aparte
 * para que quien descarga sepa exactamente que quedo afuera, en vez de un libro incompleto en
 * silencio.
 */
export async function obtenerReporteGlobal(): Promise<ReporteGlobal> {
  const [clasesConDocente, clasesSinDocente, actividadesGlobales] = await Promise.all([
    db
      .select({
        id: clase.id,
        codigo: clase.codigo,
        nombre: clase.nombre,
        seccion: clase.seccion,
        jornada: clase.jornada,
        ciclo: clase.ciclo,
        docenteNombre: docente.nombre,
      })
      .from(clase)
      .innerJoin(docente, eq(clase.docenteId, docente.id))
      .where(eq(clase.activa, true))
      .orderBy(asc(docente.nombre), asc(clase.codigo)),
    db
      .select({ id: clase.id, codigo: clase.codigo, nombre: clase.nombre })
      .from(clase)
      .where(and(isNull(clase.docenteId), eq(clase.activa, true))),
    actividadesGlobalesVisibles(),
  ]);

  const hojas = await Promise.all(clasesConDocente.map((c) => construirHoja(c, actividadesGlobales)));
  return { hojas, clasesExcluidas: clasesSinDocente };
}
