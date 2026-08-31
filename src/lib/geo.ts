/**
 * Distancia entre dos puntos de la Tierra. Ver docs/plan-geolocalizacion.md.
 *
 * Se usa la fórmula del haversine, que trata la Tierra como una esfera. El error frente a un
 * cálculo elipsoidal es de hasta 0,5 %, unos 50 cm en un radio de 100 m: irrelevante al lado
 * de la precisión del GPS de un teléfono, que en el mejor caso son 5 metros.
 */

const RADIO_TIERRA_M = 6_371_000;

const enRadianes = (grados: number) => (grados * Math.PI) / 180;

export type Punto = { lat: number; lon: number };

/** Distancia en metros entre dos puntos, redondeada. */
export function distanciaEnMetros(a: Punto, b: Punto): number {
  const dLat = enRadianes(b.lat - a.lat);
  const dLon = enRadianes(b.lon - a.lon);
  const latA = enRadianes(a.lat);
  const latB = enRadianes(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(latA) * Math.cos(latB) * Math.sin(dLon / 2) ** 2;

  return Math.round(2 * RADIO_TIERRA_M * Math.asin(Math.min(1, Math.sqrt(h))));
}

/** Una lectura tiene sentido si es un par de coordenadas real. */
export function esPuntoValido(p: { lat?: number | null; lon?: number | null }): p is Punto {
  return (
    typeof p.lat === "number" &&
    typeof p.lon === "number" &&
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lon) &&
    Math.abs(p.lat) <= 90 &&
    Math.abs(p.lon) <= 180 &&
    // (0,0) es el punto nulo del Atlantico: casi siempre significa "no hay lectura", no
    // que el alumno este flotando frente a Africa.
    !(p.lat === 0 && p.lon === 0)
  );
}

export type VeredictoZona = "dentro" | "fuera" | "sin_lectura" | "impreciso";

/**
 * Compara una lectura contra la zona declarada de la actividad.
 *
 * **No decide nada por sí sola en la etapa 1**: el resultado se guarda y se muestra, pero no
 * bloquea. Los dos casos que nunca deben tratarse como "fuera":
 *
 * - `sin_lectura`: el alumno negó el permiso o su teléfono no dio posición.
 * - `impreciso`: el margen de error del propio teléfono es mayor que el radio, así que la
 *   lectura no alcanza para afirmar nada. Rechazar ahí sería castigarlo por su telefono.
 */
export function evaluarZona({
  centro,
  radioM,
  lectura,
  precisionM,
}: {
  centro: Punto | null;
  radioM: number | null;
  lectura: Punto | null;
  precisionM: number | null;
}): { veredicto: VeredictoZona; distanciaM: number | null } {
  if (!centro || !radioM || !lectura) return { veredicto: "sin_lectura", distanciaM: null };

  const distanciaM = distanciaEnMetros(centro, lectura);

  if (precisionM !== null && precisionM > radioM) {
    return { veredicto: "impreciso", distanciaM };
  }

  // El margen de error juega a favor del alumno: si su circulo de incertidumbre toca la
  // zona, se cuenta como dentro.
  const margen = precisionM ?? 0;
  return { veredicto: distanciaM - margen <= radioM ? "dentro" : "fuera", distanciaM };
}
