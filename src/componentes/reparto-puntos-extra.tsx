"use client";

import { useState, useTransition } from "react";
import { deshacer, repartir } from "@/lib/puntos/acciones";
import { MensajeFormulario } from "@/componentes/ui/mensaje-formulario";
import { TituloSeccion } from "@/componentes/ui/titular";

export type ClaseParaRepartir = { id: string; nombre: string; total: number; extra: number };
export type AsignacionHecha = { id: string; claseNombre: string; puntos: number; cuando: string };

/**
 * A10 — el reparto, de a un punto: un toque en «+1» manda un punto a esa clase. Es la unica
 * accion dorada de la app, a proposito: ese boton *es* un punto (docs/diseno-visual.md).
 *
 * Quien decide si el reparto es valido es el servidor (`repartirPuntos`, con su candado):
 * aca solo se deshabilita el boton para no invitar a un toque que va a rebotar.
 */
export function RepartoPuntosExtra({
  saldoDisponible,
  clases,
  asignaciones,
  repartoAbierto,
}: {
  saldoDisponible: number;
  clases: ClaseParaRepartir[];
  asignaciones: AsignacionHecha[];
  repartoAbierto: boolean;
}) {
  const [pendiente, iniciarTransicion] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const puedeRepartir = saldoDisponible > 0 && repartoAbierto && !pendiente;

  function sumar(claseId: string) {
    setError(null);
    iniciarTransicion(async () => {
      const resultado = await repartir(claseId, 1);
      if (!resultado.ok) setError(resultado.error);
    });
  }

  function quitar(asignacionId: string) {
    setError(null);
    iniciarTransicion(async () => {
      const resultado = await deshacer(asignacionId);
      if (!resultado.ok) setError(resultado.error);
    });
  }

  return (
    <>
      {error && <MensajeFormulario tipo="error">{error}</MensajeFormulario>}

      {clases.length > 0 && (
        <>
          <TituloSeccion>Tus clases</TituloSeccion>
          <ul className="overflow-hidden rounded-2xl bg-white shadow-tarjeta">
            {clases.map((c) => (
              <li key={c.id} className="flex items-center gap-3 border-b border-linea px-3.5 py-3 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px] font-bold leading-snug">{c.nombre}</p>
                  <p className="text-xs text-neutral-400">
                    Lleva {c.total} {c.total === 1 ? "punto" : "puntos"}
                    {c.extra > 0 && ` · ${c.extra} extra`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => sumar(c.id)}
                  disabled={!puedeRepartir}
                  aria-label={`Sumar un punto extra a ${c.nombre}`}
                  className="h-[38px] shrink-0 rounded-full bg-accent-100 px-4 text-sm font-extrabold text-accent-700 shadow-[inset_0_0_0_1.5px_var(--color-accent-500)] transition active:scale-95 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:shadow-none"
                >
                  +1
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {asignaciones.length > 0 && (
        <>
          <TituloSeccion>Ya repartido</TituloSeccion>
          <ul className="overflow-hidden rounded-2xl bg-white shadow-tarjeta">
            {asignaciones.map((a) => (
              <li key={a.id} className="flex items-center gap-3 border-b border-linea px-3.5 py-3 last:border-b-0">
                <span className="grid size-[42px] shrink-0 place-items-center rounded-full bg-accent-100 text-sm font-bold tabular-nums text-accent-700">
                  +{a.puntos}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px] font-bold leading-snug">{a.claseNombre}</p>
                  <p className="text-xs text-neutral-400">{a.cuando}</p>
                </div>
                {repartoAbierto && (
                  <button
                    type="button"
                    onClick={() => quitar(a.id)}
                    disabled={pendiente}
                    className="text-sm font-semibold text-primary-700 disabled:opacity-50"
                  >
                    Deshacer
                  </button>
                )}
              </li>
            ))}
          </ul>
          {repartoAbierto && <p className="text-xs text-neutral-400">Podés deshacer un reparto hasta la fecha de corte.</p>}
        </>
      )}
    </>
  );
}
