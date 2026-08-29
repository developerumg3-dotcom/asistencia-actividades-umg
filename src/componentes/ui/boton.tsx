import type { ButtonHTMLAttributes } from "react";

type Variante = "primario" | "secundario" | "enlace";

const clasesBase =
  "font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2";

const clasesPorVariante: Record<Variante, string> = {
  primario: "rounded-md bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700",
  secundario:
    "rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 hover:bg-neutral-50",
  enlace: "text-sm text-neutral-600 underline hover:text-primary-700",
};

export function Boton({
  variante = "primario",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  return (
    <button
      className={`${clasesBase} ${clasesPorVariante[variante]} ${className ?? ""}`}
      {...props}
    />
  );
}
