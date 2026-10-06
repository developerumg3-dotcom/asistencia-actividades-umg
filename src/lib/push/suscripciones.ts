import "server-only";

import { countDistinct, eq, sql } from "drizzle-orm";
import { db } from "@/db/cliente";
import { alumno, suscripcionPush } from "@/db/esquema";

/**
 * Lo que la base sabe de las suscripciones push: guardarlas, borrarlas, y contar a cuantos
 * alumnos alcanzan. La logica pura del aviso vive en `aviso.ts` y el envio en `envio.ts`.
 *
 * Ver docs/plan-notificaciones-push.md, etapa 1.
 */

/** Lo que manda el navegador al suscribirse (`PushSubscription.toJSON()`). */
export type DatosSuscripcion = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type SuscripcionGuardada = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

/**
 * Guarda la suscripcion de un alumno. Idempotente a proposito: el navegador puede devolver la
 * misma suscripcion varias veces (al reinstalar el service worker, al reabrir la app), y el
 * mismo endpoint puede haber quedado de una sesion anterior de **otro** alumno en un
 * dispositivo compartido. Por eso el conflicto reasigna el `alumnoId` en vez de ignorarse: el
 * aviso tiene que ir al que esta usando ese dispositivo ahora.
 *
 * Tambien limpia `ultimoErrorEn`: si el navegador la esta volviendo a ofrecer, esta viva otra
 * vez y arrastrar el error viejo solo confundiria a quien lea la tabla.
 */
export async function guardarSuscripcion(
  alumnoId: string,
  datos: DatosSuscripcion,
): Promise<void> {
  await db
    .insert(suscripcionPush)
    .values({ alumnoId, ...datos })
    .onConflictDoUpdate({
      target: suscripcionPush.endpoint,
      set: {
        alumnoId,
        p256dh: datos.p256dh,
        auth: datos.auth,
        creadaEn: sql`now()`,
        ultimoErrorEn: null,
      },
    });
}

/**
 * Borra una suscripcion por su endpoint.
 *
 * No filtra por alumno: el endpoint ya identifica un dispositivo concreto, y el caso real es
 * el alumno que apaga los avisos despues de haberse logueado con otra cuenta en el mismo
 * telefono. Exigir que el `alumnoId` coincida dejaria una suscripcion muerta mandando avisos
 * que ya nadie pidio, que es justo lo contrario de lo que el boton promete.
 */
export async function borrarSuscripcionPorEndpoint(endpoint: string): Promise<void> {
  await db.delete(suscripcionPush).where(eq(suscripcionPush.endpoint, endpoint));
}

/** La usa el envio cuando el servicio declara muerta una direccion (404/410). */
export async function borrarSuscripcionPorId(id: string): Promise<void> {
  await db.delete(suscripcionPush).where(eq(suscripcionPush.id, id));
}

/** Un fallo que no mata la suscripcion solo deja rastro: ver `decidirSobreError` en aviso.ts. */
export async function marcarErrorDeSuscripcion(id: string): Promise<void> {
  await db
    .update(suscripcionPush)
    .set({ ultimoErrorEn: sql`now()` })
    .where(eq(suscripcionPush.id, id));
}

export async function listarSuscripciones(): Promise<SuscripcionGuardada[]> {
  return db
    .select({
      id: suscripcionPush.id,
      endpoint: suscripcionPush.endpoint,
      p256dh: suscripcionPush.p256dh,
      auth: suscripcionPush.auth,
    })
    .from(suscripcionPush);
}

export type Alcance = {
  /** Alumnos distintos con al menos una suscripcion viva. */
  suscritos: number;
  /** Alumnos activos en total, el universo contra el que se compara. */
  total: number;
};

/**
 * A cuantos de cuantos alumnos le va a llegar un aviso.
 *
 * Cuenta **alumnos distintos**, no suscripciones: uno con el telefono y la computadora son
 * dos filas pero una sola persona avisada, y lo que el administrador necesita saber es a
 * cuanta gente llega. Contar filas infla el numero y vuelve inutil justamente el dato que
 * existe para no engañarse (docs/plan-notificaciones-push.md).
 */
export async function contarAlcance(): Promise<Alcance> {
  const [suscritos] = await db
    .select({ cuenta: countDistinct(suscripcionPush.alumnoId) })
    .from(suscripcionPush)
    .innerJoin(alumno, eq(alumno.id, suscripcionPush.alumnoId))
    .where(eq(alumno.estado, "activo"));

  const [total] = await db
    .select({ cuenta: countDistinct(alumno.id) })
    .from(alumno)
    .where(eq(alumno.estado, "activo"));

  return { suscritos: suscritos?.cuenta ?? 0, total: total?.cuenta ?? 0 };
}

/** Los dispositivos de UNA cuenta: es lo que usa "Probarlo conmigo" para no avisarle a nadie mas. */
export async function listarSuscripcionesDeAlumno(alumnoId: string): Promise<SuscripcionGuardada[]> {
  return db
    .select({
      id: suscripcionPush.id,
      endpoint: suscripcionPush.endpoint,
      p256dh: suscripcionPush.p256dh,
      auth: suscripcionPush.auth,
    })
    .from(suscripcionPush)
    .where(eq(suscripcionPush.alumnoId, alumnoId));
}
