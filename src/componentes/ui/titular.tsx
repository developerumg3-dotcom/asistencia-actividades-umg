import type { ReactNode } from "react";
import Link from "next/link";
import { Icono } from "@/componentes/ui/icono";

/** Encabezado de una pantalla de primer nivel (las que tienen pestaña en la barra). */
export function Titular({
  sobre,
  titulo,
  bajada,
  children,
}: {
  /** Linea chica arriba del titulo: el saludo. */
  sobre?: ReactNode;
  titulo: ReactNode;
  bajada?: ReactNode;
  /** Lo que va a la derecha: un avatar, un contador, un boton. */
  children?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        {sobre && <p className="font-semibold text-neutral-500">{sobre}</p>}
        <h1 className="text-[25px] font-extrabold leading-tight tracking-tight">{titulo}</h1>
        {bajada && <p className="mt-0.5 text-[13.5px] text-neutral-500">{bajada}</p>}
      </div>
      {children}
    </div>
  );
}

/** Encabezado de una pantalla hija: boton de volver, titulo y un hueco a la derecha. */
export function SubBarra({
  titulo,
  volverA,
  children,
}: {
  titulo: ReactNode;
  volverA: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <Link
        href={volverA}
        aria-label="Volver"
        className="grid size-10 shrink-0 place-items-center rounded-full bg-white shadow-tarjeta"
      >
        <Icono nombre="izq" />
      </Link>
      <h1 className="min-w-0 flex-1 truncate text-[17px] font-bold">{titulo}</h1>
      {children}
    </div>
  );
}

/** Titulo de seccion dentro de una pantalla, con un hueco a la derecha para un enlace o dato. */
export function TituloSeccion({ children, lado }: { children: ReactNode; lado?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-[13px] font-bold uppercase tracking-wider text-neutral-500">{children}</h2>
      {lado && <div className="text-[13px] font-semibold text-neutral-400">{lado}</div>}
    </div>
  );
}

/** Caja punteada para "todavia no hay nada aca". */
export function Vacio({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-neutral-300 px-5 py-7 text-center text-sm text-neutral-500">
      {children}
    </div>
  );
}
