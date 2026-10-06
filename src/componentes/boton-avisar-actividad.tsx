"use client";

import { useState, useTransition } from "react";
import {
  avisarDeActividad,
  consultarAlcance,
  type AlcanceConFrase,
} from "@/lib/push/acciones";
import { Boton } from "@/componentes/ui/boton";
import { BotonAccion } from "@/componentes/ui/boton-accion";
import { Hoja } from "@/componentes/ui/hoja";
import { Tarjeta } from "@/componentes/ui/tarjeta";
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

  const hojaAbierta = alcance !== null || resultado !== null || error !== null;
  const cerrar = () => {
    setAlcance(null);
    setResultado(null);
    setError(null);
  };

  return (
    <>
      <BotonAccion icono="campana" onClick={abrirConfirmacion} disabled={pendiente}>
        {pendiente && !alcance ? "Consultando…" : "Avisar a alumnos"}
      </BotonAccion>
      <Hoja abierta={hojaAbierta} alCerrar={cerrar} titulo="Avisar a los alumnos">
        {alcance && (
          <>
            <Tarjeta className="flex flex-col gap-1.5">
              <p className="font-bold leading-snug">{alcance.frase}</p>
              {alcance.suscritos > 0 && alcance.suscritos < alcance.total && (
                <p className="text-[13px] text-neutral-500">
                  A los demás no les llega: no activaron los avisos, o tienen iPhone sin la app instalada.
                  El aviso dentro de la app sigue siendo el canal que les llega a todos.
                </p>
              )}
            </Tarjeta>
            <div className="grid grid-cols-2 gap-2.5">
              <Boton variante="secundario" onClick={cerrar} disabled={pendiente}>
                Cancelar
              </Boton>
              <Boton onClick={enviar} disabled={pendiente || alcance.suscritos === 0}>
                {pendiente ? "Enviando…" : "Enviar el aviso"}
              </Boton>
            </div>
          </>
        )}
        {resultado && <MensajeFormulario tipo="exito">{resultado}</MensajeFormulario>}
        {error && <MensajeFormulario tipo="error">{error}</MensajeFormulario>}
        {!alcance && (
          <Boton variante="secundario" onClick={cerrar} className="w-full">
            Cerrar
          </Boton>
        )}
      </Hoja>
    </>
  );
}
