import type { ReactNode } from "react";

export type TonoEtiqueta = "azul" | "celeste" | "verde" | "gris" | "oro" | "rojo";

const clasesPorTono: Record<TonoEtiqueta, string> = {
  azul: "bg-primary-600 text-white",
  celeste: "bg-primary-50 text-primary-700",
  verde: "bg-emerald-50 text-emerald-700",
  gris: "bg-neutral-100 text-neutral-600",
  oro: "bg-accent-100 text-accent-700",
  // Solo para errores y señales: el rojo no es decorativo.
  rojo: "bg-danger-50 text-danger-600",
};

/** Pastilla de estado. No es interactiva: para filtrar se usa `Chip`. */
export function Etiqueta({
  tono = "gris",
  children,
  className,
}: {
  tono?: TonoEtiqueta;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex h-[23px] shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-[11.5px] font-bold ${clasesPorTono[tono]} ${className ?? ""}`}
    >
      {children}
    </span>
  );
}
