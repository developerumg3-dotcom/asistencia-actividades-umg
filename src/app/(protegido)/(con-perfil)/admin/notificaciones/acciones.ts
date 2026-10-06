"use server";

import { resumenDeEnvio } from "@/lib/push/aviso";
import { enviarAvisoAAlumno, enviarAvisoATodos, type ResultadoEnvio } from "@/lib/push/envio";
import {
  armarAvisoGeneral,
  crearGuardaEnvios,
  idDeEnvioValido,
  validarMensajeGeneral,
  type TextoAviso,
} from "@/lib/push/mensaje-general";
import { requireAdmin } from "@/lib/sesion";

/**
 * B11 — acciones del panel de Notificaciones.
 *
 * Las Server Actions son endpoints HTTP publicos: cada una pide `requireAdmin()` por su
 * cuenta, aunque la pagina y el layout ya lo pidan. Que la pagina este protegida no protege
 * la accion. Y cada una vuelve a validar el texto: lo que valido el formulario no cuenta.
 *
 * El alcance se consulta con `consultarAlcance` (src/lib/push/acciones.ts), que ya es de admin.
 */

export type ResultadoAvisoGeneral =
  | { ok: true; mensaje: string }
  | { ok: false; error: string; errores?: { titulo?: string; mensaje?: string } };

/** Ver `crearGuardaEnvios`: protege el doble envio dentro de una misma instancia. */
const enviosReservados = crearGuardaEnvios();

type Entrada = TextoAviso & { idEnvio: string };

function preparar(entrada: Entrada):
  | { ok: true; texto: TextoAviso; idEnvio: string }
  | { ok: false; resultado: ResultadoAvisoGeneral } {
  const validacion = validarMensajeGeneral(entrada);
  if (!validacion.ok) {
    return {
      ok: false,
      resultado: { ok: false, error: "Revisá el título y el mensaje.", errores: validacion.errores },
    };
  }
  if (!idDeEnvioValido(entrada?.idEnvio)) {
    return {
      ok: false,
      resultado: { ok: false, error: "No se pudo identificar el envío. Recargá la página y probá de nuevo." },
    };
  }
  return { ok: true, texto: validacion.texto, idEnvio: entrada.idEnvio };
}

const SIN_CLAVES =
  "Las notificaciones no están configuradas en este entorno (faltan las claves VAPID).";

/** El aviso real, a todos los dispositivos suscritos. Un solo envio por `idEnvio`. */
export async function enviarAvisoGeneral(entrada: Entrada): Promise<ResultadoAvisoGeneral> {
  await requireAdmin();

  const p = preparar(entrada);
  if (!p.ok) return p.resultado;

  // Se reserva ANTES de enviar: dos peticiones simultaneas con el mismo id no pasan las dos.
  if (!enviosReservados.reservar(p.idEnvio)) {
    return {
      ok: false,
      error: "Este aviso ya se envió. Si querés mandar otro, escribilo de nuevo.",
    };
  }

  let resultado: ResultadoEnvio;
  try {
    resultado = await enviarAvisoATodos(armarAvisoGeneral(p.texto, p.idEnvio));
  } catch (error) {
    // Pudo haber salido a una parte: no se libera, para que un reintento ciego no duplique.
    console.error("[push] fallo el envio del aviso general:", error);
    return { ok: false, error: "No se pudo completar el envío. Revisá cuántos lo recibieron antes de reintentar." };
  }

  if (!resultado.configurado) {
    enviosReservados.liberar(p.idEnvio);
    return { ok: false, error: SIN_CLAVES };
  }

  return { ok: true, mensaje: resumenDeEnvio(resultado) };
}

/**
 * "Probarlo conmigo": el mismo aviso, pero SOLO a los dispositivos de la cuenta del
 * administrador que lo pide. El destinatario sale de la sesion, no de ningun parametro: no
 * hay forma de apuntarlo a otra cuenta desde el navegador.
 */
export async function probarAvisoConmigo(entrada: Entrada): Promise<ResultadoAvisoGeneral> {
  const administrador = await requireAdmin();

  const p = preparar(entrada);
  if (!p.ok) return p.resultado;

  let resultado: ResultadoEnvio;
  try {
    resultado = await enviarAvisoAAlumno(administrador.id, armarAvisoGeneral(p.texto, p.idEnvio, { prueba: true }));
  } catch (error) {
    console.error("[push] fallo el envio de prueba:", error);
    return { ok: false, error: "No se pudo mandar la prueba. Probá de nuevo en un momento." };
  }

  if (!resultado.configurado) return { ok: false, error: SIN_CLAVES };
  if (resultado.dispositivos === 0) {
    return {
      ok: false,
      error:
        "Tu cuenta no tiene ningún dispositivo con los avisos activados, así que no hay a dónde mandar la prueba.",
    };
  }
  return { ok: true, mensaje: `Prueba enviada solo a tus dispositivos. ${resumenDeEnvio(resultado)}` };
}
