"use client";

import { useState } from "react";
import { clasesDeBoton, type Variante } from "@/componentes/ui/boton";
import { Hoja } from "@/componentes/ui/hoja";
import { Icono } from "@/componentes/ui/icono";

const PASOS = [
  { titulo: "Abrí la cámara de tu teléfono", detalle: "La de siempre. No hace falta ninguna app aparte." },
  { titulo: "Apuntá al QR de la pantalla", detalle: "Está proyectado en el salón y cambia cada minuto." },
  { titulo: "Tocá el enlace y pulsá «Marcar asistencia»", detalle: "Listo: el punto se suma al instante." },
];

/**
 * Explica como se marca. No abre ninguna camara: el QR se lee con la camara nativa del
 * telefono (decision 10 de PLANIFICACION.md), asi que lo unico que hace falta es decirlo.
 */
export function ComoMarcar({
  variante = "secundario",
  chico = false,
  className,
  etiqueta = "Cómo marco mi asistencia",
}: {
  variante?: Variante;
  chico?: boolean;
  className?: string;
  etiqueta?: string;
}) {
  const [abierta, setAbierta] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierta(true)}
        className={clasesDeBoton(variante, className, chico ? "chico" : "normal")}
      >
        <Icono nombre="qr" className={chico ? "size-[17px]" : ""} />
        {etiqueta}
      </button>
      <Hoja abierta={abierta} alCerrar={() => setAbierta(false)} titulo="Cómo marcar tu asistencia">
        <ol className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-tarjeta">
          {PASOS.map((paso, indice) => (
            <li key={paso.titulo} className="flex items-start gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-600 text-sm font-bold text-white">
                {indice + 1}
              </span>
              <div>
                <p className="font-bold leading-snug">{paso.titulo}</p>
                <p className="text-[13px] text-neutral-500">{paso.detalle}</p>
              </div>
            </li>
          ))}
        </ol>
        <button type="button" onClick={() => setAbierta(false)} className={clasesDeBoton("secundario", "w-full")}>
          Entendido
        </button>
      </Hoja>
    </>
  );
}
