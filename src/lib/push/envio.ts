import "server-only";

import webpush, { WebPushError } from "web-push";
import { decidirSobreError, type Aviso } from "@/lib/push/aviso";
import {
  borrarSuscripcionPorId,
  listarSuscripciones,
  marcarErrorDeSuscripcion,
  type SuscripcionGuardada,
} from "@/lib/push/suscripciones";
import { configurarEnvio } from "@/lib/push/vapid";

/**
 * Envio de notificaciones push. La decision de que hacer con cada fallo esta en `aviso.ts`
 * (`decidirSobreError`), que es logica pura y se prueba sola; aca solo se aplica.
 *
 * Ver docs/plan-notificaciones-push.md, etapa 1.
 */

export type ResultadoEnvio = {
  /** Suscripciones que el servicio acepto. No garantiza que el alumno lo haya visto. */
  entregados: number;
  /** Direcciones muertas que se borraron en el camino (404/410). */
  borradas: number;
  /** Fallos pasajeros: la suscripcion queda, solo marcada. */
  fallidos: number;
  /** `false` si el entorno no tiene claves VAPID configuradas. */
  configurado: boolean;
};

/** El payload que lee el manejador `push` de `public/sw.js`. */
function comoPayload(aviso: Aviso): string {
  return JSON.stringify({ titulo: aviso.titulo, cuerpo: aviso.cuerpo, url: aviso.url });
}

async function enviarAUna(suscripcion: SuscripcionGuardada, payload: string): Promise<"ok" | "borrada" | "fallida"> {
  try {
    await webpush.sendNotification(
      {
        endpoint: suscripcion.endpoint,
        keys: { p256dh: suscripcion.p256dh, auth: suscripcion.auth },
      },
      payload,
      // 24 horas: un recordatorio de actividad que llega mas tarde que eso ya no sirve de
      // nada, y dejarlo en la cola del servicio solo gasta cuota.
      { TTL: 60 * 60 * 24 },
    );
    return "ok";
  } catch (error) {
    const codigo = error instanceof WebPushError ? error.statusCode : undefined;

    if (decidirSobreError(codigo) === "borrar") {
      await borrarSuscripcionPorId(suscripcion.id);
      return "borrada";
    }

    // Se registra y se sigue: un endpoint que responde mal no tiene por que impedir que les
    // llegue a los demas.
    console.error(`[push] fallo el envio a ${suscripcion.id} (codigo ${codigo ?? "sin codigo"}):`, error);
    await marcarErrorDeSuscripcion(suscripcion.id);
    return "fallida";
  }
}

/**
 * Manda un aviso a todas las suscripciones guardadas.
 *
 * En paralelo y con `Promise.all`, no en serie: con cientos de suscripciones, esperar una por
 * una contra tres servicios distintos excede el tiempo de una funcion de Netlify. Cada envio
 * atrapa su propio error, asi que ninguno puede tumbar a los demas.
 */
export async function enviarAvisoATodos(aviso: Aviso): Promise<ResultadoEnvio> {
  if (!configurarEnvio()) {
    return { entregados: 0, borradas: 0, fallidos: 0, configurado: false };
  }

  const suscripciones = await listarSuscripciones();
  const payload = comoPayload(aviso);
  const resultados = await Promise.all(suscripciones.map((s) => enviarAUna(s, payload)));

  return {
    entregados: resultados.filter((r) => r === "ok").length,
    borradas: resultados.filter((r) => r === "borrada").length,
    fallidos: resultados.filter((r) => r === "fallida").length,
    configurado: true,
  };
}
