/**
 * Todo se guarda en UTC; toda visualización usa `America/Guatemala` (AGENTS.md regla 7).
 * El servidor nunca confía en el reloj del teléfono para validar nada, pero para mostrarle
 * una fecha al alumno sí conviene la zona horaria del país.
 */
const ZONA = "America/Guatemala";

const formateadorFecha = new Intl.DateTimeFormat("es-GT", {
  timeZone: ZONA,
  day: "numeric",
  month: "long",
});

const formateadorHora = new Intl.DateTimeFormat("es-GT", {
  timeZone: ZONA,
  hour: "numeric",
  minute: "2-digit",
});

/**
 * El ICU de Node (servidor) y el del navegador (cliente) no siempre coinciden byte a byte
 * para `es-GT`: ademas del conector entre fecha y hora (resuelto abajo formateando cada una
 * por separado), el espacio que ponen antes de "p. m." puede ser uno normal en un ICU y un
 * espacio angosto de no separacion (U+202F) o de no separacion comun (U+00A0) en el otro.
 * Invisible a simple vista, pero React lo marca como error de hidratacion porque el texto no
 * es identico. Normalizar todo espacio "raro" a uno comun deja el resultado bit a bit igual
 * en los dos lados.
 */
function normalizarEspacios(texto: string): string {
  return texto.replace(/[  ]/g, " ");
}

/**
 * Fecha y hora combinadas con un separador fijo, en vez de pedirle a `Intl.DateTimeFormat`
 * que las combine en un solo `skeleton` (dia + mes + hora + minuto): combinadas, el ICU del
 * servidor y el del navegador pueden elegir un conector distinto para `es-GT` ("29 de agosto
 * a las 6:17 p. m." contra "29 de agosto, 6:17 p. m."), con el mismo problema de hidratacion.
 * Formateando fecha y hora por separado y uniendolas nosotros, el resultado es identico.
 */
export function formatearFechaHora(momento: Date): string {
  return normalizarEspacios(`${formateadorFecha.format(momento)}, ${formateadorHora.format(momento)}`);
}
