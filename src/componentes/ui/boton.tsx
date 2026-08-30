import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import Link from "next/link";

export type Variante = "primario" | "secundario" | "enlace";

const clasesBase =
  "font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2";

const clasesPorVariante: Record<Variante, string> = {
  primario: "rounded-md bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700",
  secundario:
    "rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 hover:bg-neutral-50",
  enlace: "text-sm text-neutral-600 underline hover:text-primary-700",
};

/** Las clases de una variante, para reusarlas en algo que no es un <button>. */
export function clasesDeBoton(variante: Variante = "primario", extra?: string) {
  return `${clasesBase} ${clasesPorVariante[variante]} ${extra ?? ""}`;
}

export function Boton({
  variante = "primario",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  return <button className={clasesDeBoton(variante, className)} {...props} />;
}

/**
 * Un enlace con la apariencia de un boton. Navegar no es lo mismo que ejecutar una accion:
 * usar un <button> con onClick para ir a otra pagina rompe abrir en pestaña nueva y el
 * clic con el medio. Por eso es un <Link> de verdad, con las clases del boton.
 */
export function EnlaceBoton({
  variante = "primario",
  className,
  href,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { variante?: Variante; href: string }) {
  return (
    <Link href={href} className={`inline-block ${clasesDeBoton(variante, className)}`} {...props} />
  );
}
