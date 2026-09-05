"use client";

import { useRef, useState } from "react";
import { clasesCampo } from "@/componentes/ui/campo";

const PREFIJO_POR_DEFECTO = "0908";

function dividirCarne(valor: string | null | undefined): [string, string, string] {
  const partes = (valor ?? "").split("-").map((p) => p.trim());
  if (partes.length === 3 && partes.every(Boolean)) {
    return [partes[0], partes[1], partes[2]];
  }
  return [PREFIJO_POR_DEFECTO, "", ""];
}

export function CampoCarne({
  id,
  name,
  etiqueta,
  defaultValue,
  required,
}: {
  id: string;
  name: string;
  etiqueta?: string;
  defaultValue?: string | null;
  required?: boolean;
}) {
  const [valores, setValores] = useState<[string, string, string]>(() => dividirCarne(defaultValue));
  const refPrefijo = useRef<HTMLInputElement>(null);
  const refAnio = useRef<HTMLInputElement>(null);
  const refLibre = useRef<HTMLInputElement>(null);

  const carneCompleto = valores.every(Boolean) ? valores.join(" - ") : "";

  function actualizar(indice: 0 | 1 | 2, valor: string) {
    setValores((previo) => {
      const siguiente = [...previo] as [string, string, string];
      siguiente[indice] = valor;
      return siguiente;
    });
  }

  return (
    <div className="flex flex-col gap-1">
      {etiqueta && (
        <label htmlFor={id} className="text-sm font-medium text-neutral-900">
          {etiqueta}
        </label>
      )}
      <div className="flex items-center gap-2">
        <input
          ref={refPrefijo}
          id={id}
          value={valores[0]}
          maxLength={4}
          inputMode="numeric"
          autoComplete="off"
          className={`${clasesCampo} w-20 text-center`}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 4);
            actualizar(0, v);
            if (v.length === 4) refAnio.current?.focus();
          }}
        />
        <span className="text-neutral-400">-</span>
        <input
          ref={refAnio}
          value={valores[1]}
          maxLength={2}
          inputMode="numeric"
          autoComplete="off"
          className={`${clasesCampo} w-14 text-center`}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 2);
            actualizar(1, v);
            if (v.length === 2) refLibre.current?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && valores[1] === "") refPrefijo.current?.focus();
          }}
        />
        <span className="text-neutral-400">-</span>
        <input
          ref={refLibre}
          value={valores[2]}
          maxLength={5}
          autoComplete="off"
          className={`${clasesCampo} w-24 text-center`}
          onChange={(e) => actualizar(2, e.target.value.slice(0, 5))}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && valores[2] === "") refAnio.current?.focus();
          }}
        />
      </div>
      <p className="text-xs text-neutral-500">Ej: 0908 - 22 - 7457</p>
      <input type="hidden" name={name} value={carneCompleto} required={required} />
    </div>
  );
}
