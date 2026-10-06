import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db/cliente";
import { avisoPush, entregaPush, alumno, suscripcionPush } from "@/db/esquema";
import type { Aviso } from "./aviso";
import { candadoAviso, claveAvisoActividad, crearAvisoActividad } from "./consultas-envio";
import { esFalloReintentable } from "./validacion";
import { reservarEnBatch } from "./escritura-envio";

export async function prepararAvisoActividad(actividadId: string, autorId: string, aviso: Aviso, reenvio?: string) {
  const clave = claveAvisoActividad(actividadId, reenvio);
  const [, , guardados] = await db.batch([
    db.execute(candadoAviso(clave)),
    db.execute(crearAvisoActividad(clave, actividadId, autorId, aviso)),
    db.select().from(avisoPush).where(eq(avisoPush.clave, clave)).limit(1),
  ]);
  return guardados[0] ?? null;
}

export async function obtenerAvisoInicial(actividadId: string) {
  const [aviso] = await db.select({ id: avisoPush.id, creadaEn: avisoPush.creadaEn })
    .from(avisoPush).where(eq(avisoPush.clave, claveAvisoActividad(actividadId))).limit(1);
  return aviso ?? null;
}

export type EntregaReservada = {
  id: string; intentos: number; alumnoId: string; suscripcionId: string;
  endpoint: string; p256dh: string; auth: string;
};

export async function tomarEntregas(avisoId: string): Promise<EntregaReservada[]> {
  const [, , reservadas] = await reservarEnBatch(db, avisoId);
  return reservadas.rows as EntregaReservada[];
}

/** Revalida ownership/estado inmediatamente antes de enviar, sin exponer el endpoint. */
export async function sigueVigente(e: EntregaReservada): Promise<boolean> {
  const [fila] = await db.select({ id: suscripcionPush.id }).from(suscripcionPush)
    .innerJoin(alumno, eq(alumno.id, suscripcionPush.alumnoId))
    .where(and(eq(suscripcionPush.id, e.suscripcionId), eq(suscripcionPush.alumnoId, e.alumnoId),
      eq(suscripcionPush.endpoint, e.endpoint), eq(suscripcionPush.p256dh, e.p256dh),
      eq(suscripcionPush.auth, e.auth), eq(alumno.estado, "activo"))).limit(1);
  return !!fila;
}

export async function guardarResultado(e: EntregaReservada, estado: string, codigo?: number) {
  const reintentarEn = estado === "fallida" && e.intentos < 3 && esFalloReintentable(codigo)
    ? new Date(Date.now() + 60_000 * e.intentos) : null;
  await db.update(entregaPush).set({ estado, codigoError: codigo ?? null, reintentarEn,
    aceptadaEn: estado === "aceptada" ? new Date() : null })
    .where(and(eq(entregaPush.id, e.id), eq(entregaPush.estado, "procesando"), eq(entregaPush.intentos, e.intentos)));
}

/** Un 410 viejo nunca borra una suscripcion que otro login acaba de renovar. */
export async function borrarSuscripcionSinCambios(e: EntregaReservada) {
  await db.delete(suscripcionPush).where(and(eq(suscripcionPush.id, e.suscripcionId),
    eq(suscripcionPush.alumnoId, e.alumnoId), eq(suscripcionPush.endpoint, e.endpoint),
    eq(suscripcionPush.p256dh, e.p256dh), eq(suscripcionPush.auth, e.auth)));
}

export async function resumenAviso(avisoId: string) {
  const filas = await db.select({ estado: entregaPush.estado, cantidad: sql<number>`count(*)::int` })
    .from(entregaPush).where(eq(entregaPush.avisoId, avisoId)).groupBy(entregaPush.estado);
  return Object.fromEntries(filas.map((f) => [f.estado, f.cantidad]));
}
