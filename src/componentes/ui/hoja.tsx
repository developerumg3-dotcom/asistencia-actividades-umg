"use client";

import { useEffect, type ReactNode } from "react";

/**
 * Panel que sube desde abajo, para un detalle o un formulario corto. Se cierra tocando el
 * fondo o con Escape. Quien la usa controla si esta abierta.
 */
export function Hoja({
  abierta,
  alCerrar,
  titulo,
  children,
}: {
  abierta: boolean;
  alCerrar: () => void;
  titulo?: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!abierta) return;
    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") alCerrar();
    };
    document.addEventListener("keydown", alTeclear);
    // Que el fondo no se desplace detras de la hoja.
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", alTeclear);
      document.body.style.overflow = previo;
    };
  }, [abierta, alCerrar]);

  if (!abierta) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-tinta/45 [animation:aparecer_.18s]"
      onClick={(evento) => {
        if (evento.target === evento.currentTarget) alCerrar();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="flex max-h-[88dvh] w-full max-w-xl flex-col gap-3.5 overflow-y-auto rounded-t-[26px] bg-fondo px-4 pb-[calc(1.4rem+env(safe-area-inset-bottom))] pt-2.5 [animation:subir_.26s_cubic-bezier(.2,.8,.2,1)]"
      >
        <span aria-hidden className="h-[5px] w-10 shrink-0 self-center rounded-full bg-neutral-300" />
        {titulo && <h2 className="text-[19px] font-extrabold tracking-tight">{titulo}</h2>}
        {children}
      </div>
    </div>
  );
}
