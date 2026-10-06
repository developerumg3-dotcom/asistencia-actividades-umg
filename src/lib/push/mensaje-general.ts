import { esRutaInterna, type Aviso } from "@/lib/push/aviso";

/**
 * Logica pura del aviso general que el administrador escribe a mano (/admin/notificaciones):
 * validar el texto, armar el `Aviso` y no mandar dos veces el mismo envio.
 *
 * Sin `server-only` a proposito: el formulario la importa para mostrar el contador y los
 * errores mientras se escribe, y no lleva ningun secreto. Pero la validacion que cuenta es
 * la del servidor: las Server Actions son endpoints publicos y nada de lo que valide el
 * navegador se puede dar por cierto. Se prueba en `scripts/probar-mensaje-general.mts`.
 */

/**
 * Largos maximos. Un push cifrado admite ~4 KB de payload, asi que el limite real no es ese:
 * es lo que el telefono muestra. La pantalla bloqueada recorta el titulo a una linea y el
 * cuerpo a pocas; un aviso mas largo que esto se corta justo donde se lee.
 */
export const LIMITE_TITULO = 60;
export const LIMITE_MENSAJE = 200;

/** Prefijo del titulo en "Probarlo conmigo", para no confundir una prueba con una convocatoria. */
export const PREFIJO_PRUEBA = "[Prueba] ";

/** A donde abre el aviso general: la ruta interna de siempre, nunca algo que escriba el usuario. */
export const URL_AVISO_GENERAL = "/inicio";

export type TextoAviso = { titulo: string; mensaje: string };

export type ResultadoValidacion =
  | { ok: true; texto: TextoAviso }
  | { ok: false; errores: { titulo?: string; mensaje?: string } };

// Controles C0/C1 (salvo \n y \t, que se tratan aparte) y caracteres invisibles o que invierten
// la direccion del texto: sirven para que en la pantalla bloqueada se lea otra cosa que lo que
// se reviso en el formulario.
// eslint-disable-next-line no-control-regex
const CONTROLES = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/g;
const INVISIBLES = /[​-‏‪-‮⁠-⁤⁦-⁩﻿]/g;

/** Algo con forma de etiqueta HTML: "<b>", "</p>", "<!--", "<script src=...>". */
const ETIQUETA_HTML = /<\/?[a-zA-Z!][^>]*>?/;

function limpiar(texto: string, permitirSaltos: boolean): string {
  let t = texto.normalize("NFC").replace(/\r\n?/g, "\n").replace(INVISIBLES, "").replace(CONTROLES, "");
  t = permitirSaltos
    ? t.replace(/[ \t]+/g, " ").replace(/ ?\n ?/g, "\n").replace(/\n{3,}/g, "\n\n")
    : t.replace(/\s+/g, " ");
  return t.trim();
}

function revisar(valor: string, nombre: string, limite: number): string | undefined {
  if (valor.length === 0) return `Escribí el ${nombre}.`;
  if (valor.length > limite) return `El ${nombre} pasa del máximo: ${valor.length} de ${limite} caracteres.`;
  if (ETIQUETA_HTML.test(valor)) {
    return `El ${nombre} es texto plano: sacá las etiquetas HTML (lo que va entre < y >).`;
  }
  return undefined;
}

/**
 * Valida y normaliza lo que escribio el administrador. Devuelve el texto YA limpio: es ese, y
 * no el original, el que se manda, asi la vista previa y el envio no pueden diferir.
 *
 * Acepta cualquier cosa (`unknown`) porque se llama con lo que llegue por HTTP.
 */
export function validarMensajeGeneral(entrada: unknown): ResultadoValidacion {
  const crudo = (entrada ?? {}) as { titulo?: unknown; mensaje?: unknown };
  const titulo = limpiar(typeof crudo.titulo === "string" ? crudo.titulo : "", false);
  const mensaje = limpiar(typeof crudo.mensaje === "string" ? crudo.mensaje : "", true);

  const errores = {
    titulo: revisar(titulo, "título", LIMITE_TITULO),
    mensaje: revisar(mensaje, "mensaje", LIMITE_MENSAJE),
  };
  if (errores.titulo || errores.mensaje) {
    return { ok: false, errores };
  }
  return { ok: true, texto: { titulo, mensaje } };
}

const FORMATO_ID_ENVIO = /^[A-Za-z0-9-]{8,64}$/;

/** El id de envio lo genera el navegador (`crypto.randomUUID()`); el servidor solo lo acepta si tiene forma de id. */
export function idDeEnvioValido(id: unknown): id is string {
  return typeof id === "string" && FORMATO_ID_ENVIO.test(id);
}

/**
 * Arma el `Aviso` a partir de texto ya validado. El `id` (que termina de `tag` en la bandeja)
 * sale del id de envio: el mismo envio reintentado reemplaza al anterior en el telefono, y
 * dos convocatorias distintas conviven. Una prueba lleva otro prefijo para que nunca pise a
 * un aviso real.
 */
export function armarAvisoGeneral(texto: TextoAviso, idEnvio: string, opciones?: { prueba?: boolean }): Aviso {
  if (!idDeEnvioValido(idEnvio)) throw new Error("Id de envío inválido.");
  const prueba = opciones?.prueba === true;
  const aviso: Aviso = {
    id: `${prueba ? "prueba" : "general"}-${idEnvio}`,
    titulo: prueba ? `${PREFIJO_PRUEBA}${texto.titulo}` : texto.titulo,
    cuerpo: texto.mensaje,
    url: URL_AVISO_GENERAL,
  };
  if (!esRutaInterna(aviso.url)) throw new Error("La URL del aviso no es una ruta interna.");
  return aviso;
}

/**
 * Guarda contra el doble envio: cada id de envio se reserva una sola vez.
 *
 * Es en memoria, asi que protege dentro de una misma instancia del servidor y no entre
 * instancias de Netlify; una garantia fuerte necesitaria una tabla (que esta fuera de este
 * alcance). Es la segunda linea: la primera es el boton deshabilitado, y la ultima es el
 * `tag` — dos pushes con el mismo id se reemplazan en el telefono en vez de apilarse.
 */
export function crearGuardaEnvios(vigenciaMs = 10 * 60 * 1000, ahora: () => number = Date.now) {
  const vistos = new Map<string, number>();

  function purgar() {
    const t = ahora();
    for (const [id, cuando] of vistos) if (t - cuando >= vigenciaMs) vistos.delete(id);
  }

  return {
    /** `true` la primera vez que se ve el id; `false` si ya se reservo hace poco. */
    reservar(id: string): boolean {
      purgar();
      if (vistos.has(id)) return false;
      vistos.set(id, ahora());
      return true;
    },
    /** Si el envio no salio (p. ej. faltan claves), se libera para poder reintentar. */
    liberar(id: string): void {
      vistos.delete(id);
    },
  };
}
