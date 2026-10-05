"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db/cliente";
import { actividad } from "@/db/esquema";
import { frasePorcentajeAlcance, textoDeAviso } from "@/lib/push/aviso";
import { enviarAvisoATodos } from "@/lib/push/envio";
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

export type AlcanceConFrase = Alcance & { frase: string };

/**
 * A cuantos de cuantos alumnos le llegaria un aviso ahora mismo.
 *
 * Se consulta al abrir el boton del panel y no se calcula en el render de la pagina a
 * proposito: la cuenta cambia cada vez que un alumno acepta el permiso, y una cifra cacheada
 * de hace media hora es exactamente la clase de dato que hace confiar de mas.
 */
export async function consultarAlcance(): Promise<AlcanceConFrase> {
  await requireAdmin();
  const alcance = await contarAlcance();
  return { ...alcance, frase: frasePorcentajeAlcance(alcance.suscritos, alcance.total) };
}

export type ResultadoAviso = { ok: true; mensaje: string } | { ok: false; error: string };

/** Envio manual desde /admin/actividades. En la etapa 1 no hay nada automatico. */
export async function avisarDeActividad(actividadId: string): Promise<ResultadoAviso> {
  await requireAdmin();

  const [datos] = await db
    .select({
      nombre: actividad.nombre,
      lugar: actividad.lugar,
      iniciaEn: actividad.iniciaEn,
    })
    .from(actividad)
    .where(eq(actividad.id, actividadId))
    .limit(1);

  if (!datos) return { ok: false, error: "Esa actividad ya no existe." };

  const resultado = await enviarAvisoATodos(textoDeAviso(datos));

  if (!resultado.configurado) {
    return {
      ok: false,
      error: "Las notificaciones no están configuradas en este entorno (faltan las claves VAPID).",
    };
  }

  // El detalle de lo que paso, no un "listo" a secas: el administrador tiene que poder ver
  // que una parte no llego, porque es justamente lo que no se nota solo.
  const partes = [`Enviado a ${resultado.entregados} ${resultado.entregados === 1 ? "dispositivo" : "dispositivos"}.`];
  if (resultado.borradas > 0) {
    partes.push(`Se descartaron ${resultado.borradas} que ya no existen.`);
  }
  if (resultado.fallidos > 0) {
    partes.push(`${resultado.fallidos} fallaron y se van a reintentar en el próximo aviso.`);
  }

  return { ok: true, mensaje: partes.join(" ") };
}
