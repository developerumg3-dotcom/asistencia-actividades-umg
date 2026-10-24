import { and, eq, isNull, sql } from "drizzle-orm";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { asistencia, bitacora } from "@/db/esquema";

/**
 * Escritura del caso exitoso de un marcaje: la fila de `asistencia` y su fila de `bitacora`
 * ("ok") tienen que existir las dos o ninguna.
 *
 * Va aparte de `marcaje.ts` (que importa `server-only` y abre la conexion) para poder
 * probar sin base que las dos sentencias viajan juntas. Recibe la base por parametro por lo
 * mismo.
 *
 * `neon-http` no soporta `db.transaction()` interactivo (ver AGENTS.md), pero `db.batch()` si:
 * manda todas las sentencias en una sola peticion HTTP y Neon las ejecuta dentro de una
 * transaccion. Si una falla, ninguna queda.
 *
 * Solo se usa para el caso "ok". Los rechazos (expirado, fuera de zona, duplicado, fuera de
 * horario, ...) NO pasan por aca: no escriben `asistencia`, asi que cada uno sigue siendo una
 * unica insercion en `bitacora` que no puede revertirse junto con nada. Meter los rechazos en
 * esta misma transaccion los haria desaparecer de la bitacora, que es justo lo que no debe
 * pasar (AGENTS.md, regla 9).
 */

type Base = Pick<NeonHttpDatabase<Record<string, never>>, "insert" | "update" | "batch">;

export type DatosDeEscritura = {
  asistencia: typeof asistencia.$inferInsert;
  /** Se repite en la bitacora: la IP y el dispositivo son dato de auditoria, no criterio. */
  ip?: string | null;
  dispositivoId?: string | null;
};

/** Las dos sentencias, ya armadas pero sin ejecutar. Util para inspeccionarlas en pruebas. */
export function sentenciasDeMarcajeOk(base: Base, datos: DatosDeEscritura) {
  const a = datos.asistencia;
  return [
    base.insert(asistencia).values(a),
    base.insert(bitacora).values({
      alumnoId: a.alumnoId,
      actividadId: a.actividadId,
      evento: "marcaje",
      resultado: "ok",
      ip: datos.ip ?? null,
      dispositivoId: datos.dispositivoId ?? null,
    }),
  ] as const;
}

/**
 * Ejecuta las dos sentencias en una transaccion. Si la restriccion unica
 * (alumno, actividad) salta, **toda** la transaccion se revierte (tambien la fila "ok" de
 * bitacora) y el error sube: quien llama lo traduce a "duplicado" con `esViolacionDeUnicidad`.
 */
export async function escribirMarcajeOk(base: Base, datos: DatosDeEscritura): Promise<void> {
  const [insertarAsistencia, insertarBitacora] = sentenciasDeMarcajeOk(base, datos);
  await base.batch([insertarAsistencia, insertarBitacora]);
}

export type DatosDeSalida = {
  alumnoId: string;
  actividadId: string;
  salidaEn: Date;
  /** Nulo cuando la salida es manual: no hay codigo que la respalde. */
  slotSalida: bigint | null;
  /** Solo en la salida manual: se agrega a la nota que ya tenga la asistencia. */
  notaManual?: string;
  ip?: string | null;
  dispositivoId?: string | null;
};

/** Las dos sentencias de la salida, ya armadas pero sin ejecutar. */
export function sentenciasDeSalidaOk(base: Base, datos: DatosDeSalida) {
  return [
    base
      .update(asistencia)
      .set({
        salidaEn: datos.salidaEn,
        slotSalida: datos.slotSalida,
        ...(datos.notaManual !== undefined && {
          // La entrada pudo ser por QR (sin nota) o manual (con nota): se conserva lo que haya.
          notaManual: sql`case when ${asistencia.notaManual} is null then ${`Salida manual: ${datos.notaManual}`} else ${asistencia.notaManual} || ${` | Salida manual: ${datos.notaManual}`} end`,
        }),
      })
      // `salida_en is null` hace que dos pulsaciones simultaneas no se pisen la hora.
      .where(
        and(
          eq(asistencia.alumnoId, datos.alumnoId),
          eq(asistencia.actividadId, datos.actividadId),
          isNull(asistencia.salidaEn),
        ),
      ),
    base.insert(bitacora).values({
      alumnoId: datos.alumnoId,
      actividadId: datos.actividadId,
      evento: "marcaje",
      resultado: "ok",
      ip: datos.ip ?? null,
      dispositivoId: datos.dispositivoId ?? null,
    }),
  ] as const;
}

/** Completa la asistencia con la salida y anota el "ok", las dos o ninguna (como la entrada). */
export async function escribirSalidaOk(base: Base, datos: DatosDeSalida): Promise<void> {
  const [completar, anotar] = sentenciasDeSalidaOk(base, datos);
  await base.batch([completar, anotar]);
}

/**
 * El driver de @neondatabase/serverless envuelve el error real de Postgres dentro de
 * `.cause`. Mismo criterio que en el guardado del perfil.
 */
export function esViolacionDeUnicidad(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  if ("code" in error && (error as { code?: string }).code === "23505") return true;
  if ("cause" in error) return esViolacionDeUnicidad((error as { cause?: unknown }).cause);
  return false;
}
