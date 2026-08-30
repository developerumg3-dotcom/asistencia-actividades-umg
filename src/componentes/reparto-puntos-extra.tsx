"use client";

import { useState, useTransition } from "react";
import { deshacer, repartir } from "@/app/(protegido)/(con-perfil)/puntos-extra/acciones";
import { Boton } from "@/componentes/ui/boton";
import { Campo } from "@/componentes/ui/campo";
import { MensajeFormulario } from "@/componentes/ui/mensaje-formulario";
import { enGuatemala } from "@/lib/fechas";
import type { AsignacionExtraVisible } from "@/lib/puntos/consulta";

export function RepartoPuntosExtra({
  saldoDisponible,
  asignaciones,
  clasesParaRepartir,
  repartoAbierto,
}: {
  saldoDisponible: number;
  asignaciones: AsignacionExtraVisible[];
  clasesParaRepartir: { id: string; codigo: string; nombre: string }[];
  repartoAbierto: boolean;
}) {
  const [claseId, setClaseId] = useState(clasesParaRepartir[0]?.id ?? "");
  const [puntos, setPuntos] = useState(1);
  const [pendiente, iniciarTransicion] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function enviarReparto() {
    setError(null);
    iniciarTransicion(async () => {
      const resultado = await repartir(claseId, puntos);
      if (!resultado.ok) setError(resultado.error);
      else setPuntos(1);
    });
  }

  function enviarDeshacer(asignacionId: string) {
    setError(null);
    iniciarTransicion(async () => {
      const resultado = await deshacer(asignacionId);
      if (!resultado.ok) setError(resultado.error);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {saldoDisponible > 0 && repartoAbierto && clasesParaRepartir.length > 0 && (
        <div className="flex flex-col gap-3 rounded-md border border-neutral-200 p-4">
          <p className="text-sm font-medium text-neutral-900">Repartir</p>
          <div className="flex flex-wrap items-end gap-3">
            <Campo
              id="clase-reparto"
              as="select"
              etiqueta="Clase"
              value={claseId}
              onChange={(evento) => setClaseId(evento.target.value)}
              className="min-w-48"
            >
              {clasesParaRepartir.map((clase) => (
                <option key={clase.id} value={clase.id}>
                  {clase.codigo} — {clase.nombre}
                </option>
              ))}
            </Campo>
            <Campo
              id="puntos-reparto"
              type="number"
              etiqueta="Puntos"
              min={1}
              max={saldoDisponible}
              step={1}
              value={puntos}
              onChange={(evento) => setPuntos(Number(evento.target.value))}
              className="w-24"
            />
            <Boton type="button" onClick={enviarReparto} disabled={pendiente || !claseId}>
              {pendiente ? "Repartiendo…" : "Repartir"}
            </Boton>
          </div>
        </div>
      )}

      {error && <MensajeFormulario tipo="error">{error}</MensajeFormulario>}

      {asignaciones.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-neutral-900">Ya repartido</p>
          <ul className="flex flex-col gap-2">
            {asignaciones.map((asignacion) => (
              <li
                key={asignacion.id}
                className="flex items-center justify-between gap-3 rounded-md border border-neutral-200 px-3 py-2 text-sm"
              >
                <div>
                  <p className="text-neutral-900">{asignacion.claseNombre}</p>
                  <p className="text-xs text-neutral-500">{enGuatemala(asignacion.creadaEn)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular-nums font-semibold text-primary-700">+{asignacion.puntos}</span>
                  {repartoAbierto && (
                    <button
                      type="button"
                      onClick={() => enviarDeshacer(asignacion.id)}
                      disabled={pendiente}
                      className="text-xs text-neutral-500 underline hover:text-danger-600 disabled:pointer-events-none disabled:opacity-50"
                    >
                      Deshacer
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
