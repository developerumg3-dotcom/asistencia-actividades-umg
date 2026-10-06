import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import Link from "next/link";

const clasesBase =
  "inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[13.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2";

function clasesDeChip(activo: boolean, extra?: string) {
  const estado = activo ? "bg-tinta text-white" : "bg-white text-neutral-600 shadow-tarjeta hover:text-primary-700";
  return `${clasesBase} ${estado} ${extra ?? ""}`;
}

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
  return <button type="button" aria-pressed={activo} className={clasesDeChip(activo, className)} {...props} />;
}

/** El mismo chip cuando el filtro vive en la URL (pantallas de servidor): es un enlace. */
export function EnlaceChip({
  activo = false,
  className,
  href,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { activo?: boolean; href: string }) {
  return (
    <Link
      href={href}
      aria-current={activo ? "true" : undefined}
      className={clasesDeChip(activo, className)}
      {...props}
    />
  );
}

/** La fila que contiene los chips: se desplaza de lado y llega hasta el borde de la pantalla. */
export function FilaDeChips({ children }: { children: React.ReactNode }) {
  return <div className="sin-barra -mx-4 flex gap-2 overflow-x-auto px-4 py-0.5">{children}</div>;
}
