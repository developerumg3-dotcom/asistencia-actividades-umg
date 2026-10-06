import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icono, type NombreIcono } from "@/componentes/ui/icono";

/** Las clases del contenedor, para reusarlas en un <a> o un <Link>. */
export const clasesAccion =
  "flex w-full flex-col items-center gap-1.5 text-center text-[11.5px] font-semibold leading-tight text-neutral-500 disabled:opacity-50";

/** El circulo con el icono y la etiqueta debajo. */
export function CuerpoAccion({ icono, children }: { icono: NombreIcono; children: ReactNode }) {
  return (
    <>
      <span className="grid size-[50px] place-items-center rounded-full bg-white text-primary-700 shadow-tarjeta">
        <Icono nombre={icono} />
      </span>
      {children}
    </>
  );
}

/**
 * Accion rapida en una fila de cuatro: un circulo con icono y su nombre debajo. Se usa en el
 * detalle de una actividad (kiosco, marcaje manual, avisar, editar).
 */
export function BotonAccion({
  icono,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { icono: NombreIcono }) {
  return (
    <button type="button" className={clasesAccion} {...props}>
      <CuerpoAccion icono={icono}>{children}</CuerpoAccion>
    </button>
  );
}
