"use client";

import { useState, useTransition } from "react";
import {
  avisarDeActividad,
  consultarAlcance,
  type AlcanceConFrase,
} from "@/lib/push/acciones";
import { Boton } from "@/componentes/ui/boton";
import { MensajeFormulario } from "@/componentes/ui/mensaje-formulario";

/**
 * B3 — "Avisar a los alumnos" de una actividad.
 *
 * Pulsar el boton **no manda nada**: primero consulta y muestra a cuantos de cuantos alumnos
 * le va a llegar, y recien entonces aparece el boton de enviar. Es deliberado y es la pieza
 * mas importante del diseño (docs/plan-notificaciones-push.md): las notificaciones solo
 * llegan a quien acepto el permiso y —en iPhone— instalo la app, asi que un envio sin esa
 * cifra enfrente se siente como "le avise a todo el curso" cuando pudo haber llegado a seis
 * personas. Y no hay nada despues que lo desmienta.
 */
export function BotonAvisarActividad({ actividadId }: { actividadId: string }) {
  const [alcance, setAlcance] = useState<AlcanceConFrase | null>(null);
  const [resultado, setResultado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciarTransicion] = useTransition();

  function abrirConfirmacion() {
    setError(null);
    setResultado(null);
    iniciarTransicion(async () => {
      try {
        setAlcance(await consultarAlcance());
      } catch (fallo) {
        console.error("[push] no se pudo consultar el alcance:", fallo);
        setError("No se pudo consultar a cuántos alumnos llegaría. Probá de nuevo.");
      }
    });
  }

  function enviar() {
    setError(null);
    iniciarTransicion(async () => {
      const r = await avisarDeActividad(actividadId);
      // La confirmacion se cierra en los dos casos: la cifra que se mostro ya quedo vieja
      // (el envio pudo borrar direcciones muertas) y dejarla a la vista mentiria.
      setAlcance(null);
      if (r.ok) setResultado(r.mensaje);
      else setError(r.error);
    });
  }

  if (alcance) {
    return (
      <div className="flex flex-col items-end gap-2">
        <p className="text-sm font-medium text-neutral-900">{alcance.frase}</p>
        {alcance.suscritos > 0 && alcance.suscritos < alcance.total && (
          <p className="max-w-xs text-right text-xs text-neutral-500">
            A los demás no les llega: no activaron los avisos, o tienen iPhone sin la app
            instalada. El aviso dentro de la app sigue siendo el canal que les llega a todos.
          </p>
        )}
        <div className="flex items-center gap-3">
          <Boton variante="enlace" onClick={() => setAlcance(null)} disabled={pendiente}>
            Cancelar
          </Boton>
          <Boton
            variante="secundario"
            onClick={enviar}
            disabled={pendiente || alcance.suscritos === 0}
          >
            {pendiente ? "Enviando…" : "Enviar el aviso"}
          </Boton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Boton variante="enlace" onClick={abrirConfirmacion} disabled={pendiente}>
        {pendiente ? "Consultando…" : "Avisar a los alumnos"}
      </Boton>
      {resultado && <MensajeFormulario tipo="exito">{resultado}</MensajeFormulario>}
      {error && <MensajeFormulario tipo="error">{error}</MensajeFormulario>}
    </div>
  );
}
