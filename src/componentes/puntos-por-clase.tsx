"use client";

import { useState } from "react";
import { clasesDeBoton } from "@/componentes/ui/boton";
import { Hoja } from "@/componentes/ui/hoja";
import { Icono } from "@/componentes/ui/icono";

export type ActividadDeLaClase = {
  id: string;
  nombre: string;
  /** Ya armado en el servidor ("6 oct · marcaste 9:12 a. m."): aca no se formatean fechas. */
  detalle: string;
  asistio: boolean;
};

export type ClaseConPuntos = {
  id: string;
  codigo: string;
  nombre: string;
  total: number;
  extra: number;
  actividades: ActividadDeLaClase[];
};

function Bolita({ tono }: { tono: "si" | "no" | "extra" }) {
  const clases = {
    si: "border-primary-600 bg-primary-600",
    no: "border-neutral-300",
    extra: "border-accent-500 bg-accent-500",
  }[tono];
  return <span aria-hidden className={`size-[11px] rounded-full border-2 ${clases}`} />;
}

/**
 * A9 — los puntos del alumno, una tarjeta por clase. Reemplaza la tabla clase × actividad,
 * que en un telefono dejaba el total fuera de la pantalla: aca el total es lo mas grande, y
 * el detalle actividad por actividad se abre al tocar.
 */
export function PuntosPorClase({ clases }: { clases: ClaseConPuntos[] }) {
  const [abiertaId, setAbiertaId] = useState<string | null>(null);
  const abierta = clases.find((c) => c.id === abiertaId) ?? null;

  return (
    <>
      <ul className="flex flex-col gap-2.5">
        {clases.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => setAbiertaId(c.id)}
              className="flex w-full items-center gap-3 rounded-2xl bg-white p-3.5 text-left shadow-tarjeta transition active:scale-[.985]"
            >
              <span className="min-w-0 flex-1">
                <span className="block font-bold leading-snug">{c.nombre}</span>
                <span className="block text-xs text-neutral-400">{c.codigo}</span>
                <span className="mt-2 flex flex-wrap gap-[5px]">
                  {c.actividades.map((a) => (
                    <Bolita key={a.id} tono={a.asistio ? "si" : "no"} />
                  ))}
                  {Array.from({ length: c.extra }, (_, i) => (
                    <Bolita key={`extra-${i}`} tono="extra" />
                  ))}
                </span>
              </span>
              <span className="text-right leading-none">
                <span className="block text-[30px] font-extrabold tabular-nums tracking-tight text-primary-700">
                  {c.total}
                </span>
                <span className="mt-1 block text-[10.5px] font-bold uppercase tracking-wider text-neutral-400">
                  {c.total === 1 ? "punto" : "puntos"}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-x-3.5 gap-y-1 text-xs text-neutral-500">
        <span className="flex items-center gap-1.5">
          <Bolita tono="si" />
          Asististe
        </span>
        <span className="flex items-center gap-1.5">
          <Bolita tono="no" />
          No asististe
        </span>
        <span className="flex items-center gap-1.5">
          <Bolita tono="extra" />
          Punto extra
        </span>
      </div>

      <Hoja abierta={abierta !== null} alCerrar={() => setAbiertaId(null)}>
        {abierta && (
          <>
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-[19px] font-extrabold leading-snug tracking-tight">{abierta.nombre}</h2>
                <p className="text-[13px] text-neutral-500">{abierta.codigo}</p>
              </div>
              <div className="text-right leading-none">
                <p className="text-[40px] font-extrabold tabular-nums tracking-tight text-primary-700">
                  {abierta.total}
                </p>
                <p className="mt-1 text-[10.5px] font-bold uppercase tracking-wider text-neutral-400">
                  {abierta.total === 1 ? "punto" : "puntos"}
                </p>
              </div>
            </div>
            <ul className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-tarjeta">
              {abierta.actividades.length === 0 && abierta.extra === 0 && (
                <li className="text-sm text-neutral-500">Todavía no hubo actividades.</li>
              )}
              {abierta.actividades.map((a) => (
                <li key={a.id} className="flex items-center gap-3">
                  <span
                    className={`grid size-[26px] shrink-0 place-items-center rounded-[9px] border-2 text-white ${
                      a.asistio ? "border-primary-600 bg-primary-600" : "border-neutral-300"
                    }`}
                  >
                    {a.asistio && <Icono nombre="ok" grosor={3} className="size-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold leading-snug">{a.nombre}</span>
                    <span className="block text-xs text-neutral-400">{a.detalle}</span>
                  </span>
                  <b className={`tabular-nums ${a.asistio ? "text-primary-700" : "text-neutral-400"}`}>
                    {a.asistio ? "+1" : "0"}
                  </b>
                </li>
              ))}
              {abierta.extra > 0 && (
                <li className="flex items-center gap-3">
                  <span className="grid size-[26px] shrink-0 place-items-center rounded-[9px] bg-accent-500 text-white">
                    <Icono nombre="regalo" className="size-4" />
                  </span>
                  <span className="flex-1 text-sm font-bold">Puntos extra que repartiste acá</span>
                  <b className="tabular-nums text-accent-700">+{abierta.extra}</b>
                </li>
              )}
            </ul>
            <p className="text-xs text-neutral-400">
              Las actividades globales suman en todas tus clases a la vez. Los puntos extra van solo a la
              clase que elijas.
            </p>
            <button type="button" onClick={() => setAbiertaId(null)} className={clasesDeBoton("secundario", "w-full")}>
              Cerrar
            </button>
          </>
        )}
      </Hoja>
    </>
  );
}
