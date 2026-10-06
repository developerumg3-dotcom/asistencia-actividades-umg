import "server-only";
import webpush, { WebPushError } from "web-push";
import { db } from "@/db/cliente";
import { avisoPush } from "@/db/esquema";
import { eq } from "drizzle-orm";
import { configurarEnvio } from "./vapid";
import { esSuscripcionPush } from "./validacion";
import { procesarEntrega } from "./proceso-entrega";
import { borrarSuscripcionSinCambios, guardarResultado, resumenAviso, sigueVigente, tomarEntregas, type EntregaReservada } from "./registro-envio";

async function enviarAUna(e: EntregaReservada, payload: string) {
  await procesarEntrega({
    // Incluye suscripciones anteriores: destino restringido y propietario revalidado.
    vigente: async () => esSuscripcionPush(e) && await sigueVigente(e),
    enviar: async () => { await webpush.sendNotification(
      { endpoint: e.endpoint, keys: { p256dh: e.p256dh, auth: e.auth } }, payload,
      { TTL: 86400, timeout: 8_000 }); },
    codigo: (error) => error instanceof WebPushError ? error.statusCode : undefined,
    // Nunca registrar error completo, endpoint, payload ni claves.
    anotarFallo: (codigo) => console.error("[push] entrega " + e.id + ": codigo " + (codigo ?? "sin respuesta")),
    guardar: (estado, codigo) => guardarResultado(e, estado, codigo),
    baja: () => borrarSuscripcionSinCambios(e),
  });
}

/** Solo transporta entregas reservadas: nunca volver a enviar una aceptada. */
export async function enviarAvisoGuardado(avisoId: string) {
  if (!configurarEnvio()) return { configurado: false, resumen: {} as Record<string, number> };
  const [aviso] = await db.select().from(avisoPush).where(eq(avisoPush.id, avisoId)).limit(1);
  if (!aviso || aviso.canceladaEn || (aviso.programadaEn && aviso.programadaEn > new Date())) {
    return { configurado: true, resumen: await resumenAviso(avisoId) };
  }
  const payload = JSON.stringify({ titulo: aviso.titulo, cuerpo: aviso.cuerpo, url: aviso.url, avisoId: aviso.id });
  // Lote de 20, concurrencia de 10; trabajo acotado por invocacion serverless.
  // Limite por invocacion; pendientes se retoman con la misma identidad.
    const entregas = await tomarEntregas(avisoId);
    for (let inicio = 0; inicio < entregas.length; inicio += 10) {
      const resultados = await Promise.allSettled(entregas.slice(inicio, inicio + 10).map((e) => enviarAUna(e, payload)));
      if (resultados.some((r) => r.status === "rejected")) {
        // No incluir error ORM: puede llevar parametros de suscripcion.
        console.error("[push] algunas entregas requieren revision de persistencia");
      }
    }
  return { configurado: true, resumen: await resumenAviso(avisoId) };
}
