/**
 * Fase de marcaje que corresponde a un momento (PLANIFICACION.md §6.5). Logica pura, sin
 * base, para poder probarla sin conexion.
 *
 * Una actividad normal solo tiene "entrada" (la ventana de siempre). Con doble marcaje hay
 * dos rangos fijos y separados; el hueco entre ellos y todo lo de fuera es `null`.
 */

export type FaseMarcaje = "entrada" | "salida";

export type VentanasDeMarcaje = {
  marcajeAbreEn: Date;
  marcajeCierraEn: Date;
  dobleMarcaje: boolean;
  salidaAbreEn: Date | null;
  salidaCierraEn: Date | null;
};

export function faseVigente(v: VentanasDeMarcaje, ahora: Date): FaseMarcaje | null {
  if (ahora >= v.marcajeAbreEn && ahora <= v.marcajeCierraEn) return "entrada";
  if (
    v.dobleMarcaje &&
    v.salidaAbreEn &&
    v.salidaCierraEn &&
    ahora >= v.salidaAbreEn &&
    ahora <= v.salidaCierraEn
  ) {
    return "salida";
  }
  return null;
}

/** Cuando deja de aceptarse cualquier marcaje: la salida si la hay, la entrada si no. */
export function cierreFinal(v: VentanasDeMarcaje): Date {
  return v.dobleMarcaje && v.salidaCierraEn ? v.salidaCierraEn : v.marcajeCierraEn;
}
