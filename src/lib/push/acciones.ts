"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db/cliente";
import { actividad } from "@/db/esquema";
import { frasePorcentajeAlcance, textoDeAviso } from "@/lib/push/aviso";
import { enviarAvisoGuardado } from "@/lib/push/envio";
import { obtenerAvisoInicial, prepararAvisoActividad } from "@/lib/push/registro-envio";
import { esUuid } from "@/lib/push/validacion";
import { enGuatemala } from "@/lib/fechas";
import {
  borrarSuscripcionPorEndpoint,
  contarAlcance,
  guardarSuscripcion,
  type Alcance,
  type DatosSuscripcion,
} from "@/lib/push/suscripciones";
import { requireAdmin, requireAlumno } from "@/lib/sesion";

/**
 * Acciones de servidor de las notificaciones push: las dos del alumno (activar y apagar los
 * avisos) y las dos del panel (ver el alcance y enviar).
 *
 * Ver docs/plan-notificaciones-push.md, etapa 1.
 */

export type ResultadoSuscripcion = { ok: true } | { ok: false; error: string };

/** El alumno acepto el permiso: se guarda la suscripcion que le dio el navegador. */
export async function activarAvisos(datos: DatosSuscripcion): Promise<ResultadoSuscripcion> {
  const alumnoActual = await requireAlumno();

  if (!datos.endpoint || !datos.p256dh || !datos.auth) {
    return { ok: false, error: "El navegador no devolvió una suscripción completa." };
  }

  try {
    await guardarSuscripcion(alumnoActual.id, datos);
    return { ok: true };
  } catch (error) {
    console.error("[push] no se pudo guardar la suscripcion:", error);
    return { ok: false, error: "No se pudo guardar. Probá de nuevo en un momento." };
  }
}

/**
 * El alumno apago los avisos.
 *
 * Pide sesion igual que `activarAvisos`, aunque el endpoint ya identifique el dispositivo: no
 * tiene sentido dejar que cualquiera sin sesion borre suscripciones ajenas probando endpoints.
 */
export async function apagarAvisos(endpoint: string): Promise<ResultadoSuscripcion> {
  await requireAlumno();
  if (!endpoint) return { ok: false, error: "Falta la suscripción a borrar." };

  try {
    await borrarSuscripcionPorEndpoint(endpoint);
    return { ok: true };
  } catch (error) {
    console.error("[push] no se pudo borrar la suscripcion:", error);
    return { ok: false, error: "No se pudo apagar. Probá de nuevo en un momento." };
  }
}

export type AlcanceConFrase = Alcance & { frase: string; avisoAnterior?: string | null };

/**
 * A cuantos de cuantos alumnos le llegaria un aviso ahora mismo.
 *
 * Se consulta al abrir el boton del panel y no se calcula en el render de la pagina a
 * proposito: la cuenta cambia cada vez que un alumno acepta el permiso, y una cifra cacheada
 * de hace media hora es exactamente la clase de dato que hace confiar de mas.
 */
export async function consultarAlcance(actividadId?: string): Promise<AlcanceConFrase> {
  await requireAdmin();
  const alcance = await contarAlcance();
  if (actividadId !== undefined && !esUuid(actividadId)) throw new Error("Actividad no válida.");
  const anterior = actividadId ? await obtenerAvisoInicial(actividadId) : null;
  return { ...alcance, frase: frasePorcentajeAlcance(alcance.suscritos, alcance.total),
    avisoAnterior: anterior ? enGuatemala(anterior.creadaEn) : null };
}

export type ResultadoAviso = { ok: true; mensaje: string } | { ok: false; error: string };

/** Envio manual desde /admin/actividades. En la etapa 1 no hay nada automatico. */
export async function avisarDeActividad(actividadId: string, reenvio?: string): Promise<ResultadoAviso> {
  const quienAdministra = await requireAdmin();
  if (!esUuid(actividadId) || (reenvio !== undefined && !esUuid(reenvio))) {
    return { ok: false, error: "Actividad o solicitud no válida." };
  }

  const [datos] = await db
    .select({
      nombre: actividad.nombre,
      lugar: actividad.lugar,
      iniciaEn: actividad.iniciaEn,
      estado: actividad.estado,
    })
    .from(actividad)
    .where(eq(actividad.id, actividadId))
    .limit(1);

  if (!datos) return { ok: false, error: "Esa actividad ya no existe." };
  if (datos.estado !== "publicada") return { ok: false, error: "Solo se puede avisar de una actividad publicada." };

  try {
    const aviso = await prepararAvisoActividad(actividadId, quienAdministra.id, textoDeAviso(datos), reenvio);
    if (!aviso) return { ok: false, error: "La actividad dejó de estar publicada." };
    const resultado = await enviarAvisoGuardado(aviso.id);

    if (!resultado.configurado) {
      return { ok: false, error: "Las notificaciones no están configuradas en este entorno." };
    }

  // El detalle de lo que paso, no un "listo" a secas: el administrador tiene que poder ver
  // que una parte no llego, porque es justamente lo que no se nota solo.
    const r = resultado.resumen;
    return { ok: true, mensaje: `Este aviso: ${r.aceptada ?? 0} aceptadas por el proveedor, ` +
      `${r.pendiente ?? 0} pendientes, ${r.fallida ?? 0} fallidas, ${r.descartada ?? 0} descartadas, ` +
      `${(r.procesando ?? 0) + (r.incierta ?? 0)} en proceso o inciertas. Repetir no reenvía las aceptadas.` };
  } catch {
    return { ok: false, error: "No se pudo completar el aviso. Pedí que revisen su estado antes de enviar uno nuevo." };
  }
}
