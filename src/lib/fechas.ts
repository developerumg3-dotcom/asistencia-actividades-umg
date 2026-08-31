/**
 * Fechas del proyecto. La base guarda todo en UTC y la interfaz muestra todo en
 * `America/Guatemala` (UTC−6, sin horario de verano). Ver PLANIFICACION.md §4.
 *
 * Guatemala no aplica horario de verano desde 2006, asi que el desfase es constante. Aun
 * asi el formateo va por `Intl` y no por una resta fija: si algun dia cambiara, esto no se
 * entera pero tampoco miente.
 */

export const ZONA = "America/Guatemala";

const FORMATO_FECHA = new Intl.DateTimeFormat("es-GT", {
  timeZone: ZONA,
  dateStyle: "medium",
});

const FORMATO_HORA = new Intl.DateTimeFormat("es-GT", {
  timeZone: ZONA,
  timeStyle: "short",
});

/**
 * El ICU de Node (servidor) y el del navegador (cliente) no siempre coinciden byte a byte
 * para `es-GT`. Dos formas en que aparece:
 *
 * - Un `dateStyle` + `timeStyle` combinados en un solo `Intl.DateTimeFormat` pueden elegir un
 *   conector distinto entre fecha y hora segun el ICU. Por eso `enGuatemala` no usa un solo
 *   formateador combinado: formatea fecha y hora por separado y las une con un separador
 *   fijo, para que el resultado sea identico en los dos lados.
 * - El espacio antes de "p. m." puede ser uno normal en un ICU y un espacio angosto de no
 *   separacion (U+202F) o de no separacion comun (U+00A0) en el otro — invisible a simple
 *   vista. `normalizarEspacios` lo deja siempre en un espacio comun.
 *
 * Si alguna de estas dos funciones llega a usarse dentro de un componente cliente (hoy solo
 * se usan en componentes de servidor, donde esto no aplica), la diferencia se manifiesta como
 * un error de hidratacion de React: "Hydration failed because the server rendered text didn't
 * match the client." Ver la nota en AGENTS.md.
 */
function normalizarEspacios(texto: string): string {
  return texto.replace(/[  ]/g, " ");
}

/** "5 sept 2026, 2:30 p. m." */
export function enGuatemala(fecha: Date): string {
  return normalizarEspacios(`${FORMATO_FECHA.format(fecha)}, ${FORMATO_HORA.format(fecha)}`);
}

/** "2:30 p. m." */
export function horaEnGuatemala(fecha: Date): string {
  return normalizarEspacios(FORMATO_HORA.format(fecha));
}

/**
 * Desfase de la zona respecto de UTC, en minutos, para un instante dado.
 *
 * Se calcula preguntandole a `Intl` que hora local corresponde a ese instante, en vez de
 * asumir −6: si la regla de la zona cambiara, esto sigue siendo correcto.
 */
function desfaseMinutos(instante: Date): number {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONA,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instante);

  const valor = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value);
  const comoUtc = Date.UTC(
    valor("year"),
    valor("month") - 1,
    valor("day"),
    valor("hour") % 24,
    valor("minute"),
    valor("second"),
  );
  return (comoUtc - instante.getTime()) / 60000;
}

/**
 * Convierte lo que escribe el administrador en un `<input type="datetime-local">` —que no
 * lleva zona— al instante UTC que representa **en hora de Guatemala**.
 *
 * Sin esto, `new Date("2026-09-05T14:00")` se interpreta en la zona del servidor, que en
 * hospedaje serverless (Netlify, Vercel, o el que sea) suele ser UTC: la actividad quedaria
 * seis horas corrida.
 */
export function desdeCampoLocal(valor: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(valor)) return null;

  // Primera aproximacion: leer el texto como si fuera UTC.
  const comoSiFueraUtc = new Date(`${valor}Z`);
  if (Number.isNaN(comoSiFueraUtc.getTime())) return null;

  // Y corregir por el desfase real de la zona en ese momento.
  const desfase = desfaseMinutos(comoSiFueraUtc);
  return new Date(comoSiFueraUtc.getTime() - desfase * 60000);
}

/** El inverso: instante UTC → texto para `<input type="datetime-local">`. */
export function haciaCampoLocal(fecha: Date): string {
  const desfase = desfaseMinutos(fecha);
  const local = new Date(fecha.getTime() + desfase * 60000);
  return local.toISOString().slice(0, 16);
}

/**
 * Medianoche de "hoy" en hora de Guatemala, como instante UTC. Para el Tablero (B1, Fase 4):
 * "asistencias marcadas hoy" se cuenta contra el dia calendario de Guatemala, no contra las
 * ultimas 24 horas exactas. Reusa `desdeCampoLocal` sobre la fecha Y-M-D que da `Intl` para
 * esa zona, igual patron que el resto de este modulo.
 */
export function inicioDeHoyEnGuatemala(momento: Date = new Date()): Date {
  const fechaYmd = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA }).format(momento);
  const inicio = desdeCampoLocal(`${fechaYmd}T00:00`);
  // fechaYmd siempre matchea el patron que espera desdeCampoLocal: no puede dar null.
  return inicio as Date;
}
