"use client";

import type { ButtonHTMLAttributes } from "react";

/**
 * Boton de filtro en forma de pastilla. Se usa en fila horizontal desplazable cuando las
 * opciones son pocas y conviene verlas todas de un vistazo, en vez de esconderlas en un
 * <select>. Ver docs/diseno-visual.md.
 */
export function Chip({
  activo = false,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { activo?: boolean }) {
  const estado = activo
    ? "border-primary-600 bg-primary-600 text-white"
    : "border-neutral-300 bg-white text-neutral-700 hover:border-primary-400 hover:text-primary-700";

  return (
    <button
      type="button"
      aria-pressed={activo}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${estado} ${className ?? ""}`}
      {...props}
    />
  );
}
