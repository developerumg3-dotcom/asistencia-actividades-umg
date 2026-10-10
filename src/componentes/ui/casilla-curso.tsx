import type { ReactNode } from "react";
import { Icono } from "@/componentes/ui/icono";

function Marca({ marcada }: { marcada: boolean }) {
  return (
    <span
      aria-hidden
      className={`grid size-[26px] shrink-0 place-items-center rounded-[9px] border-2 text-white transition-colors ${
        marcada ? "border-primary-600 bg-primary-600" : "border-neutral-300 bg-white"
      }`}
    >
      {marcada && <Icono nombre="ok" grosor={3} className="size-4" />}
    </span>
  );
}

/**
 * Un curso como fila entera tocable, con casilla. Toda la fila es el <label> de un checkbox
 * real: un solo toque la marca, sin capas flotantes ni foco de por medio. El borde se dibuja
 * con sombra interior para que marcar no cambie el tamaño de la fila.
 */
export function CasillaCurso({
  titulo,
  detalle,
  pie,
  marcada,
  disabled,
  alCambiar,
  variante = "tarjeta",
}: {
  titulo: ReactNode;
  detalle?: ReactNode;
  pie?: ReactNode;
  marcada: boolean;
  disabled?: boolean;
  alCambiar: (marcada: boolean) => void;
  /** "tarjeta" va sobre el fondo gris de la pantalla; "borde", dentro de una tarjeta blanca. */
  variante?: "tarjeta" | "borde";
}) {
  const sinMarcar = variante === "tarjeta" ? "shadow-tarjeta" : "shadow-[inset_0_0_0_1.5px_var(--color-linea)]";
  const conMarca =
    variante === "tarjeta"
      ? "shadow-[inset_0_0_0_2px_var(--color-primary-600)]"
      : "bg-primary-50 shadow-[inset_0_0_0_2px_var(--color-primary-600)]";

  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-2xl p-3.5 transition-shadow ${
        marcada ? conMarca : sinMarcar
      } ${variante === "tarjeta" || !marcada ? "bg-white" : ""}`}
    >
      <input
        type="checkbox"
        checked={marcada}
        disabled={disabled}
        onChange={(evento) => alCambiar(evento.target.checked)}
        className="sr-only"
      />
      <Marca marcada={marcada} />
      <span className="flex min-w-0 flex-col">
        <span className="text-[14.5px] font-bold leading-snug">{titulo}</span>
        {detalle && <span className="text-xs text-neutral-400">{detalle}</span>}
        {pie && <span className="text-[13px] text-neutral-500">{pie}</span>}
      </span>
    </label>
  );
}
