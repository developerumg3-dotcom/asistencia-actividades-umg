import "server-only";

import { and, eq, or } from "drizzle-orm";
import { db } from "@/db/cliente";
import { actividad, alumno, asistencia, bitacora, inscripcion } from "@/db/esquema";
import { slotDe, validarCodigo } from "@/lib/qr/codigo";

/**
 * Registro de asistencia por QR. Junta la derivacion del codigo (`codigo.ts`, logica pura)
 * con lo que solo sabe la base: si la actividad existe, si esta abierta, si el alumno ya
 * marco. Ver PLANIFICACION.md §6 y §7.
 *
 * Dos reglas que no se negocian y estan puestas aca a proposito:
 *
 * 1. **Todo intento va a `bitacora`**, valido o no. Es la unica forma de investigar despues.
 * 2. **La asistencia se guarda aunque el alumno no este inscrito a ninguna clase.** Los
 *    puntos aparecen solos cuando se inscriba. Perder una asistencia real por un tramite
 *    pendiente seria el peor error posible del sistema.
 */

export type ResultadoMarcaje =
  | "ok"
  | "expirado"
  | "duplicado"
  | "invalido"
  | "fuera_de_horario"
  | "sin_perfil";

export type Marcaje =
  | { resultado: "ok"; marcadaEn: Date; actividadNombre: string }
  | { resultado: "duplicado"; marcadaEn: Date; actividadNombre: string }
  | { resultado: Exclude<ResultadoMarcaje, "ok" | "duplicado">; actividadNombre: string | null };

export type DatosDeBitacora = {
  ip?: string | null;
  dispositivoId?: string | null;
};

/** Los textos exactos de PLANIFICACION.md §7. No improvisar variantes. */
export function mensajeDe(marcaje: Marcaje, horaLegible?: string): string {
  switch (marcaje.resultado) {
    case "ok":
      return "Listo, quedó registrada tu asistencia.";
    case "expirado":
      return "El código ya cambió. Escaneá otra vez el de la pantalla.";
    case "duplicado":
      return `Ya marcaste asistencia en esta actividad a las ${horaLegible ?? ""}.`.trim();
    case "sin_perfil":
      return "Completá tu carné y nombre para registrar tu asistencia.";
    case "invalido":
      return "Ese código no corresponde a esta actividad.";
    case "fuera_de_horario":
      return "La actividad todavía no abre o ya cerró.";
  }
}

async function anotar(
  alumnoId: string,
  actividadId: string | null,
  resultado: ResultadoMarcaje,
  datos: DatosDeBitacora,
) {
  await db.insert(bitacora).values({
    alumnoId,
    actividadId,
    evento: "marcaje",
    resultado,
    // La IP es dato de bitacora, nunca criterio: todo el campus sale por la misma
    // (PLANIFICACION.md §7). Guardarla y no usarla para decidir es deliberado.
    ip: datos.ip ?? null,
    dispositivoId: datos.dispositivoId ?? null,
  });
}

export async function registrarMarcaje({
  alumno,
  codigoCorto,
  codigo,
  momento = new Date(),
  datos = {},
}: {
  alumno: { id: string; perfilCompleto: boolean };
  codigoCorto: string;
  codigo: string;
  /** La hora en que llega el boton, no la del escaneo. Es lo que vuelve inutil la foto. */
  momento?: Date;
  datos?: DatosDeBitacora;
}): Promise<Marcaje> {
  const [laActividad] = await db
    .select({
      id: actividad.id,
      nombre: actividad.nombre,
      estado: actividad.estado,
      secretoQr: actividad.secretoQr,
      ventanaSeg: actividad.ventanaSeg,
      marcajeAbreEn: actividad.marcajeAbreEn,
      marcajeCierraEn: actividad.marcajeCierraEn,
    })
    .from(actividad)
    .where(eq(actividad.codigoCorto, codigoCorto))
    .limit(1);

  // Sin actividad no hay `actividad_id` que anotar, pero el intento igual queda registrado.
  if (!laActividad) {
    await anotar(alumno.id, null, "invalido", datos);
    return { resultado: "invalido", actividadNombre: null };
  }

  const nombre = laActividad.nombre;

  // El perfil se exige antes que nada: sin carne, la asistencia no le sirve a nadie.
  if (!alumno.perfilCompleto) {
    await anotar(alumno.id, laActividad.id, "sin_perfil", datos);
    return { resultado: "sin_perfil", actividadNombre: nombre };
  }

  // Un borrador o una actividad cerrada no aceptan marcaje aunque el codigo sea el vigente.
  if (laActividad.estado !== "publicada") {
    await anotar(alumno.id, laActividad.id, "fuera_de_horario", datos);
    return { resultado: "fuera_de_horario", actividadNombre: nombre };
  }

  if (momento < laActividad.marcajeAbreEn || momento > laActividad.marcajeCierraEn) {
    await anotar(alumno.id, laActividad.id, "fuera_de_horario", datos);
    return { resultado: "fuera_de_horario", actividadNombre: nombre };
  }

  // El duplicado se consulta antes de validar el codigo: al alumno que ya marco hay que
  // decirle que ya marco, no que su codigo vencio.
  const [yaMarco] = await db
    .select({ marcadaEn: asistencia.marcadaEn })
    .from(asistencia)
    .where(and(eq(asistencia.alumnoId, alumno.id), eq(asistencia.actividadId, laActividad.id)))
    .limit(1);

  if (yaMarco) {
    await anotar(alumno.id, laActividad.id, "duplicado", datos);
    return { resultado: "duplicado", marcadaEn: yaMarco.marcadaEn, actividadNombre: nombre };
  }

  const veredicto = validarCodigo({
    secreto: laActividad.secretoQr,
    actividadId: laActividad.id,
    ventanaSeg: laActividad.ventanaSeg,
    codigo,
    momento,
  });

  if (veredicto !== "ok") {
    await anotar(alumno.id, laActividad.id, veredicto, datos);
    return { resultado: veredicto, actividadNombre: nombre };
  }

  // Foto de las clases del alumno en este instante. Solo auditoria: los puntos se calculan
  // contra las inscripciones vigentes, no contra esto (PLANIFICACION.md §4).
  const inscripciones = await db
    .select({ claseId: inscripcion.claseId })
    .from(inscripcion)
    .where(eq(inscripcion.alumnoId, alumno.id));

  try {
    await db.insert(asistencia).values({
      alumnoId: alumno.id,
      actividadId: laActividad.id,
      marcadaEn: momento,
      slot: BigInt(slotDe(momento, laActividad.ventanaSeg)),
      origen: "qr",
      ip: datos.ip ?? null,
      dispositivoId: datos.dispositivoId ?? null,
      // La asistencia se guarda aunque el arreglo venga vacio: sin clases inscritas
      // tambien cuenta, y los puntos apareceran cuando se inscriba.
      clasesSnapshot: inscripciones.map((i) => i.claseId),
    });
  } catch (error) {
    // Dos peticiones del mismo alumno en el mismo segundo: la restriccion unica
    // (alumno, actividad) atrapa a la segunda. No es un fallo, es un duplicado.
    if (esViolacionDeUnicidad(error)) {
      const [existente] = await db
        .select({ marcadaEn: asistencia.marcadaEn })
        .from(asistencia)
        .where(and(eq(asistencia.alumnoId, alumno.id), eq(asistencia.actividadId, laActividad.id)))
        .limit(1);
      await anotar(alumno.id, laActividad.id, "duplicado", datos);
      return {
        resultado: "duplicado",
        marcadaEn: existente?.marcadaEn ?? momento,
        actividadNombre: nombre,
      };
    }
    throw error;
  }

  await anotar(alumno.id, laActividad.id, "ok", datos);
  return { resultado: "ok", marcadaEn: momento, actividadNombre: nombre };
}

export type ResultadoMarcajeManual =
  | { resultado: "ok"; marcadaEn: Date }
  | { resultado: "duplicado"; marcadaEn: Date }
  | { resultado: "sin_perfil" }
  | { resultado: "no_encontrado" }
  | { resultado: "actividad_no_encontrada" };

/**
 * B8 — marcaje manual, para quien no tiene telefono o tuvo un problema tecnico durante la
 * ventana. Confirmado con Daniel el 30 de agosto de 2026: se permite **sin restriccion de
 * horario ni de estado de la actividad** — es justo el mecanismo para cubrir ese caso. La
 * justificacion obligatoria mas el propio acto del administrador de crearlo son la
 * aprobacion; no hay un paso adicional. Sigue valiendo "un escaneo por actividad" (duplicado)
 * y el perfil incompleto, igual que el marcaje por QR — ver `registrarMarcaje`.
 */
export async function registrarMarcajeManual({
  actividadId,
  identificadorAlumno,
  justificacion,
}: {
  actividadId: string;
  /** Carne o correo, coincidencia exacta: es una busqueda puntual durante un evento en vivo. */
  identificadorAlumno: string;
  justificacion: string;
}): Promise<ResultadoMarcajeManual> {
  const [laActividad] = await db
    .select({ ventanaSeg: actividad.ventanaSeg })
    .from(actividad)
    .where(eq(actividad.id, actividadId))
    .limit(1);
  if (!laActividad) return { resultado: "actividad_no_encontrada" };

  const termino = identificadorAlumno.trim();
  const [elAlumno] = await db
    .select({ id: alumno.id, perfilCompleto: alumno.perfilCompleto })
    .from(alumno)
    .where(or(eq(alumno.carne, termino), eq(alumno.email, termino)))
    .limit(1);
  if (!elAlumno) return { resultado: "no_encontrado" };

  if (!elAlumno.perfilCompleto) {
    await anotar(elAlumno.id, actividadId, "sin_perfil", {});
    return { resultado: "sin_perfil" };
  }

  const [yaMarco] = await db
    .select({ marcadaEn: asistencia.marcadaEn })
    .from(asistencia)
    .where(and(eq(asistencia.alumnoId, elAlumno.id), eq(asistencia.actividadId, actividadId)))
    .limit(1);
  if (yaMarco) {
    await anotar(elAlumno.id, actividadId, "duplicado", {});
    return { resultado: "duplicado", marcadaEn: yaMarco.marcadaEn };
  }

  const momento = new Date();
  const inscripciones = await db
    .select({ claseId: inscripcion.claseId })
    .from(inscripcion)
    .where(eq(inscripcion.alumnoId, elAlumno.id));

  try {
    await db.insert(asistencia).values({
      alumnoId: elAlumno.id,
      actividadId,
      marcadaEn: momento,
      slot: BigInt(slotDe(momento, laActividad.ventanaSeg)),
      origen: "manual",
      notaManual: justificacion,
      clasesSnapshot: inscripciones.map((i) => i.claseId),
    });
  } catch (error) {
    if (esViolacionDeUnicidad(error)) {
      await anotar(elAlumno.id, actividadId, "duplicado", {});
      return { resultado: "duplicado", marcadaEn: momento };
    }
    throw error;
  }

  await anotar(elAlumno.id, actividadId, "ok", {});
  return { resultado: "ok", marcadaEn: momento };
}

/**
 * El driver de @neondatabase/serverless envuelve el error real de Postgres dentro de
 * `.cause`. Mismo criterio que en el guardado del perfil.
 */
function esViolacionDeUnicidad(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  if ("code" in error && (error as { code?: string }).code === "23505") return true;
  if ("cause" in error) return esViolacionDeUnicidad((error as { cause?: unknown }).cause);
  return false;
}
