import type { HTMLAttributes } from "react";

/** Superficie blanca sobre el fondo gris: se separa por sombra, no por borde. */
export function Tarjeta({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-2xl bg-white p-4 shadow-tarjeta ${className ?? ""}`} {...props} />;
}
