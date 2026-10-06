/**
 * Validacion del destino al que se vuelve despues de iniciar sesion.
 *
 * El destino llega por un campo oculto del formulario, o sea que lo controla quien arme la
 * peticion. Revisar solo que empiece por "/" y no por "//" no alcanza: el cliente de Next
 * resuelve la redireccion con `new URL`, y en HTTP(S) la barra invertida cuenta como
 * separador (https://url.spec.whatwg.org/#relative-slash-state), asi que "/\ejemplo.com"
 * se resuelve como "//ejemplo.com" y saca al usuario del origen.
 *
 * Por eso aca el destino se resuelve contra un origen fijo y solo se devuelve lo interno.
 */

// Origen ficticio y fijo: solo sirve para resolver; nunca se devuelve ni se consulta.
const ORIGEN_CONFIABLE = "https://ronda.invalid";

// Caracteres de control (incluye tab, CR y LF, que el parser de URL descarta en silencio)
// y la barra invertida, que el parser trata como "/".
// eslint-disable-next-line no-control-regex
const PROHIBIDOS = /[\u0000-\u001f\u007f-\u009f\\]/;

export function destinoSeguro(valor: unknown, porDefecto = "/"): string {
  if (typeof valor !== "string") return porDefecto;
  const crudo = valor.trim();

  // Debe ser una ruta absoluta del sitio; "//" seria relativo al esquema (otro host).
  if (!crudo.startsWith("/") || crudo.startsWith("//")) return porDefecto;
  if (PROHIBIDOS.test(crudo)) return porDefecto;

  let url: URL;
  try {
    url = new URL(crudo, ORIGEN_CONFIABLE);
  } catch {
    return porDefecto;
  }
  if (url.origin !== ORIGEN_CONFIABLE) return porDefecto;

  // La normalizacion puede dejar un pathname que empieza por "//" (p. ej. "/.//ejemplo.com"),
  // que el navegador volveria a leer como otro host.
  const interno = url.pathname + url.search + url.hash;
  if (!interno.startsWith("/") || interno.startsWith("//")) return porDefecto;
  if (PROHIBIDOS.test(interno)) return porDefecto;

  return interno;
}
