/**
 * Fechas del proyecto. La base guarda todo en UTC y la interfaz muestra todo en
 * `America/Guatemala` (UTC−6, sin horario de verano). Ver PLANIFICACION.md §4.
 *
 * Guatemala no aplica horario de verano desde 2006, asi que el desfase es constante. Aun
 * asi el formateo va por `Intl` y no por una resta fija: si algun dia cambiara, esto no se
 * entera pero tampoco miente.
 */

export const ZONA = "America/Guatemala";

const FORMATO_LARGO = new Intl.DateTimeFormat("es-GT", {
  timeZone: ZONA,
  dateStyle: "medium",
  timeStyle: "short",
});

const FORMATO_HORA = new Intl.DateTimeFormat("es-GT", {
  timeZone: ZONA,
  timeStyle: "short",
});

/** "5 sept 2026, 14:30" */
export function enGuatemala(fecha: Date): string {
  return FORMATO_LARGO.format(fecha);
}

/** "14:30" */
export function horaEnGuatemala(fecha: Date): string {
  return FORMATO_HORA.format(fecha);
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
 * Vercel es UTC: la actividad quedaria seis horas corrida.
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
