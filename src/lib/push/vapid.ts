import "server-only";

import webpush from "web-push";

/**
 * Claves VAPID. Mismo trato que el `secreto_qr` (AGENTS.md, regla 1): la privada no sale del
 * servidor nunca, y por eso este modulo lleva `server-only` — si algun dia alguien lo importa
 * desde un componente cliente, la compilacion falla en vez de filtrarla en silencio.
 *
 * La publica si termina en el navegador (sin ella no hay forma de suscribirse), pero viaja
 * como propiedad desde un componente de servidor, no como `NEXT_PUBLIC_`: asi hay un solo
 * lugar del que sale y no queda incrustada en todos los paquetes del cliente.
 *
 * Ver docs/plan-notificaciones-push.md y `.env.example`.
 */

export type ClavesVapid = {
  publica: string;
  privada: string;
  sujeto: string;
};

function leerClaves(): ClavesVapid | null {
  const publica = process.env.VAPID_PUBLIC_KEY?.trim();
  const privada = process.env.VAPID_PRIVATE_KEY?.trim();
  const sujeto = process.env.VAPID_SUBJECT?.trim();
  if (!publica || !privada || !sujeto) return null;
  return { publica, privada, sujeto };
}

/**
 * La clave publica, o `null` si las notificaciones no estan configuradas en este entorno.
 *
 * Devuelve `null` en vez de tirar: sin claves la app tiene que seguir funcionando igual, solo
 * sin avisos. Las notificaciones son un recordatorio extra, no el canal principal
 * (docs/plan-notificaciones-push.md) — tumbar `/inicio` porque falta una variable de entorno
 * seria cambiar una comodidad por una caida.
 */
export function clavePublicaVapid(): string | null {
  return leerClaves()?.publica ?? null;
}

/**
 * Configura `web-push` con las claves y devuelve `true` si quedo listo para enviar.
 *
 * `setVapidDetails` es estado global del modulo, asi que se vuelve a aplicar en cada envio: en
 * hospedaje serverless cada invocacion puede caer en un proceso nuevo que no lo tiene puesto.
 */
export function configurarEnvio(): boolean {
  const claves = leerClaves();
  if (!claves) return false;
  webpush.setVapidDetails(claves.sujeto, claves.publica, claves.privada);
  return true;
}
