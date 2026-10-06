import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import Link from "next/link";

export type Variante = "primario" | "secundario" | "suave" | "enlace";
export type Tamano = "normal" | "chico";

const clasesBase =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold transition active:scale-[.97] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2";

const clasesPorTamano: Record<Tamano, string> = {
  normal: "h-12 rounded-xl px-5 text-[15px]",
  chico: "h-9 rounded-[11px] px-3.5 text-[13px]",
};

const clasesPorVariante: Record<Variante, string> = {
  primario: "bg-primary-600 text-white hover:bg-primary-700",
  secundario: "bg-white text-tinta shadow-[inset_0_0_0_1.5px_var(--color-linea)] hover:bg-neutral-50",
  suave: "bg-primary-50 text-primary-700 hover:bg-primary-100",
  enlace: "text-sm font-semibold text-primary-700 hover:text-primary-800",
};

/** Las clases de una variante, para reusarlas en algo que no es un <button>. */
export function clasesDeBoton(variante: Variante = "primario", extra?: string, tamano: Tamano = "normal") {
  // El enlace es texto: no lleva alto ni relleno de boton.
  const medida = variante === "enlace" ? "" : clasesPorTamano[tamano];
  return `${clasesBase} ${medida} ${clasesPorVariante[variante]} ${extra ?? ""}`;
}

export function Boton({
  variante = "primario",
  tamano = "normal",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; tamano?: Tamano }) {
  return <button className={clasesDeBoton(variante, className, tamano)} {...props} />;
}

/**
 * Un enlace con la apariencia de un boton. Navegar no es lo mismo que ejecutar una accion:
 * usar un <button> con onClick para ir a otra pagina rompe abrir en pestaña nueva y el
 * clic con el medio. Por eso es un <Link> de verdad, con las clases del boton.
 */
export function EnlaceBoton({
  variante = "primario",
  tamano = "normal",
  className,
  href,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { variante?: Variante; tamano?: Tamano; href: string }) {
  return <Link href={href} className={clasesDeBoton(variante, className, tamano)} {...props} />;
}
