/**
 * Deteccion de "senales raras" en la bitacora (B9, Fase 4): nunca una accion automatica,
 * solo resaltado para que el administrador decida que hacer. Logica pura, sin acceso a la
 * base — igual patron que `lib/qr/codigo.ts` y `lib/puntos/calculo.ts` — para poder probarla
 * sin levantar la aplicacion. Quien la llama (`consulta.ts`) le pasa las filas ya leidas.
 *
 * Dos senales, confirmadas con Daniel el 30 de agosto de 2026:
 *
 * 1. Un mismo alumno acumula varios intentos con resultado distinto de "ok" en poco tiempo.
 * 2. Un mismo dispositivo aparece detras de varios alumnos distintos.
 */

export type EventoParaSenal = {
  id: string;
  alumnoId: string;
  dispositivoId: string | null;
  resultado: string | null;
  ocurrioEn: Date;
};

/** Punto de partida para ajustar durante las pruebas de la Fase 4 — ver docs/fase-4.md. */
export const UMBRAL_INTENTOS_FALLIDOS = 5;
export const VENTANA_INTENTOS_FALLIDOS_MIN = 10;
export const UMBRAL_ALUMNOS_POR_DISPOSITIVO = 2;

export type SenalesBitacora = {
  /** Ids de fila marcadas por "mismo alumno, varios fallos seguidos". */
  porIntentosFallidos: ReadonlySet<string>;
  /** Ids de fila marcadas por "mismo dispositivo, varios alumnos". */
  porDispositivoCompartido: ReadonlySet<string>;
};

function detectarIntentosFallidos(eventos: EventoParaSenal[]): Set<string> {
  const marcados = new Set<string>();
  const porAlumno = new Map<string, EventoParaSenal[]>();

  for (const evento of eventos) {
    if (evento.resultado === null || evento.resultado === "ok") continue;
    const lista = porAlumno.get(evento.alumnoId);
    if (lista) lista.push(evento);
    else porAlumno.set(evento.alumnoId, [evento]);
  }

  for (const lista of porAlumno.values()) {
    const ordenada = [...lista].sort((a, b) => a.ocurrioEn.getTime() - b.ocurrioEn.getTime());
    const ventanaMs = VENTANA_INTENTOS_FALLIDOS_MIN * 60_000;
    for (let i = 0; i < ordenada.length; i++) {
      const inicioVentana = ordenada[i].ocurrioEn.getTime();
      const enVentana = ordenada.filter((e) => {
        const delta = e.ocurrioEn.getTime() - inicioVentana;
        return delta >= 0 && delta <= ventanaMs;
      });
      if (enVentana.length >= UMBRAL_INTENTOS_FALLIDOS) {
        for (const e of enVentana) marcados.add(e.id);
      }
    }
  }

  return marcados;
}

function detectarDispositivoCompartido(eventos: EventoParaSenal[]): Set<string> {
  const marcados = new Set<string>();
  const porDispositivo = new Map<string, EventoParaSenal[]>();

  for (const evento of eventos) {
    if (!evento.dispositivoId) continue;
    const lista = porDispositivo.get(evento.dispositivoId);
    if (lista) lista.push(evento);
    else porDispositivo.set(evento.dispositivoId, [evento]);
  }

  for (const lista of porDispositivo.values()) {
    const alumnosDistintos = new Set(lista.map((e) => e.alumnoId));
    if (alumnosDistintos.size >= UMBRAL_ALUMNOS_POR_DISPOSITIVO) {
      for (const e of lista) marcados.add(e.id);
    }
  }

  return marcados;
}

export function detectarSenales(eventos: EventoParaSenal[]): SenalesBitacora {
  return {
    porIntentosFallidos: detectarIntentosFallidos(eventos),
    porDispositivoCompartido: detectarDispositivoCompartido(eventos),
  };
}
