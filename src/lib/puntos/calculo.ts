/**
 * Calculo puro de puntos. Sin acceso a la base: PLANIFICACION.md §5 es explicito en que los
 * puntos no se almacenan, se calculan a partir de `asistencia` y `asignacion_extra` contra
 * las inscripciones vigentes. Este modulo hace ese calculo; quien lo llama (`consulta.ts`) le
 * pasa los datos ya leidos de la base. Igual que `lib/qr/codigo.ts` no toca la base: se puede
 * probar entero sin levantar la aplicacion (ver ESTRUCTURA.md).
 */

export type ActividadGlobal = {
  id: string;
  nombre: string;
};

export type ClaseInscrita = {
  id: string;
  codigo: string;
  nombre: string;
};

export type AsignacionExtra = {
  actividadId: string;
  claseId: string;
  puntos: number;
};

export type FilaParticipacion = {
  claseId: string;
  claseCodigo: string;
  claseNombre: string;
  /** 1 si el alumno marco asistencia en esa actividad global, 0 si no. Clave = actividad.id. */
  marcas: Record<string, 0 | 1>;
  extra: number;
  total: number;
};

export type TablaParticipaciones = {
  /** Solo actividades tipo global: la columna "Extra" de la tabla va aparte, ya sumada. */
  columnas: ActividadGlobal[];
  filas: FilaParticipacion[];
};

/**
 * Tabla de participaciones de un alumno: una fila por clase en la que esta inscrito **ahora**
 * (§5 — no hay fecha de corte de inscripcion, una clase agregada despues de la actividad
 * recibe el punto igual), una columna por actividad global con su nombre real, mas el total
 * de puntos extra ya asignados a esa clase. Mismo calculo que alimenta la hoja de Excel de la
 * §9: por eso vive aislado aca y no adentro de la pantalla.
 */
export function calcularParticipaciones(params: {
  clasesInscritas: ClaseInscrita[];
  actividadesGlobales: ActividadGlobal[];
  /** Ids de actividad global en las que el alumno tiene asistencia registrada. */
  actividadIdsConAsistencia: ReadonlySet<string>;
  asignacionesExtra: AsignacionExtra[];
}): TablaParticipaciones {
  const { clasesInscritas, actividadesGlobales, actividadIdsConAsistencia, asignacionesExtra } = params;

  const extraPorClase = new Map<string, number>();
  for (const asignacion of asignacionesExtra) {
    extraPorClase.set(asignacion.claseId, (extraPorClase.get(asignacion.claseId) ?? 0) + asignacion.puntos);
  }

  const filas = clasesInscritas.map((clase): FilaParticipacion => {
    const marcas: Record<string, 0 | 1> = {};
    let sumaGlobal = 0;
    for (const actividad of actividadesGlobales) {
      const marco = actividadIdsConAsistencia.has(actividad.id) ? 1 : 0;
      marcas[actividad.id] = marco;
      sumaGlobal += marco;
    }
    const extra = extraPorClase.get(clase.id) ?? 0;
    return {
      claseId: clase.id,
      claseCodigo: clase.codigo,
      claseNombre: clase.nombre,
      marcas,
      extra,
      total: sumaGlobal + extra,
    };
  });

  return { columnas: actividadesGlobales, filas };
}

export type AsistenciaExtra = {
  actividadId: string;
  /** Puntos que otorga esa actividad extra (`actividad.puntos`, 2 por defecto). */
  puntos: number;
};

export type SaldoPorActividad = {
  actividadId: string;
  /** Lo que queda de esa actividad puntual: lo ganado en ella menos lo ya repartido de ella. */
  disponible: number;
};

/**
 * Saldo disponible desglosado por actividad extra de origen. `asignacion_extra.actividad_id`
 * es obligatorio en el esquema (§4), asi que cada reparto tiene que quedar atado a una
 * actividad puntual aunque el alumno vea un solo saldo combinado en pantalla — ver
 * `distribuirEntreActividadesExtra`. El orden de entrada de `asistenciasExtra` es el orden en
 * que se consume (mas antigua primero).
 */
export function calcularSaldoPorActividad(params: {
  asistenciasExtra: AsistenciaExtra[];
  asignacionesExtra: Pick<AsignacionExtra, "actividadId" | "puntos">[];
}): SaldoPorActividad[] {
  const repartidoPorActividad = new Map<string, number>();
  for (const asignacion of params.asignacionesExtra) {
    repartidoPorActividad.set(
      asignacion.actividadId,
      (repartidoPorActividad.get(asignacion.actividadId) ?? 0) + asignacion.puntos,
    );
  }
  return params.asistenciasExtra.map(({ actividadId, puntos }) => ({
    actividadId,
    disponible: puntos - (repartidoPorActividad.get(actividadId) ?? 0),
  }));
}

/** Saldo combinado que ve el alumno: "Tenés N puntos por asignar" (§5). */
export function calcularSaldoExtra(params: {
  asistenciasExtra: AsistenciaExtra[];
  asignacionesExtra: Pick<AsignacionExtra, "actividadId" | "puntos">[];
}): number {
  return calcularSaldoPorActividad(params).reduce((suma, s) => suma + s.disponible, 0);
}

/**
 * En que actividades de origen apoyar un reparto de `puntos`, consumiendo la mas antigua
 * primero. Asume que el llamador ya confirmo que el total alcanza (`esRepartoValido`); si no
 * alcanza, devuelve lo que pudo cubrir sin completar el pedido.
 */
export function distribuirEntreActividadesExtra(params: {
  puntos: number;
  saldosPorActividad: SaldoPorActividad[];
}): { actividadId: string; puntos: number }[] {
  let restante = params.puntos;
  const resultado: { actividadId: string; puntos: number }[] = [];
  for (const { actividadId, disponible } of params.saldosPorActividad) {
    if (restante <= 0) break;
    if (disponible <= 0) continue;
    const tomar = Math.min(disponible, restante);
    resultado.push({ actividadId, puntos: tomar });
    restante -= tomar;
  }
  return resultado;
}

/** Reglas de reparto de la §5: enteros, positivos, sin superar el saldo, hacia clase inscrita. */
export function esRepartoValido(params: {
  puntos: number;
  saldoDisponible: number;
  claseInscrita: boolean;
}): boolean {
  const { puntos, saldoDisponible, claseInscrita } = params;
  if (!claseInscrita) return false;
  if (!Number.isInteger(puntos) || puntos <= 0) return false;
  if (puntos > saldoDisponible) return false;
  return true;
}

/** Horas desde el cierre de marcaje de la ultima actividad hasta que el reparto se congela. */
export const HORAS_CORTE_REPARTO = 48;

/** A partir de cuantas horas antes del corte el aviso de saldo pendiente se vuelve insistente. */
export const HORAS_AVISO_URGENTE = 24;

/**
 * Fecha de corte del reparto: 48 h despues del cierre de marcaje de la ultima actividad
 * (§5, decision 3 de §14). Se cuenta desde `marcaje_cierra_en`, no desde `termina_en`:
 * `termina_en` es solo informativo (§4) y puede caer antes de que la ventana de marcaje de
 * esa misma actividad termine de aceptar asistencias. Contar el corte desde `termina_en`
 * arriesgaria cerrar el reparto de puntos que todavia se podian ganar de forma legitima.
 * Devuelve null si todavia no hay ninguna actividad publicada o cerrada: sin eso no hay nada
 * que cortar.
 */
export function calcularFechaDeCorte(ultimoCierreDeMarcaje: Date | null): Date | null {
  if (!ultimoCierreDeMarcaje) return null;
  return new Date(ultimoCierreDeMarcaje.getTime() + HORAS_CORTE_REPARTO * 60 * 60 * 1000);
}

/** Si todavia se puede repartir o deshacer un reparto, en el momento dado. */
export function repartoSigueAbierto(momento: Date, corte: Date | null): boolean {
  if (!corte) return true;
  return momento.getTime() < corte.getTime();
}

/** Si el aviso de saldo pendiente debe mostrarse en su version mas insistente (§5). */
export function avisoEsUrgente(momento: Date, corte: Date | null): boolean {
  if (!corte) return false;
  const msRestantes = corte.getTime() - momento.getTime();
  return msRestantes > 0 && msRestantes <= HORAS_AVISO_URGENTE * 60 * 60 * 1000;
}
