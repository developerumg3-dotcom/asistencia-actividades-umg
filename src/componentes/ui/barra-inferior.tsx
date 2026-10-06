"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icono, type NombreIcono } from "@/componentes/ui/icono";

export type Pestana = {
  href: string;
  icono: NombreIcono;
  etiqueta: string;
  /** Numero chico sobre el icono (el saldo extra sin repartir). Si es 0 no se muestra. */
  globo?: number;
  /** Rutas hijas que tambien encienden esta pestaña aunque no empiecen igual. */
  tambien?: string[];
  /** "/admin" es prefijo de todo el panel: solo se enciende con la ruta exacta. */
  exacta?: boolean;
};

/** La navegacion de la app: fija abajo, con iconos. Ver docs/diseno-visual.md. */
export function BarraInferior({ pestanas }: { pestanas: Pestana[] }) {
  const ruta = usePathname();

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-linea bg-white/95 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-xl px-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-1.5">
        {pestanas.map((p) => {
          const activa = p.exacta
            ? ruta === p.href
            : ruta.startsWith(p.href) || (p.tambien ?? []).some((otra) => ruta.startsWith(otra));
          return (
            <Link
              key={p.href}
              href={p.href}
              aria-current={activa ? "page" : undefined}
              className={`relative flex flex-1 flex-col items-center gap-0.5 rounded-xl px-0.5 py-1.5 text-[10.5px] font-semibold ${
                activa ? "text-primary-700" : "text-neutral-400"
              }`}
            >
              <span
                className={`grid h-[30px] w-[52px] place-items-center rounded-full transition-colors ${
                  activa ? "bg-primary-100" : ""
                }`}
              >
                <Icono nombre={p.icono} />
              </span>
              {p.etiqueta}
              {!!p.globo && (
                <span className="absolute left-[calc(50%+8px)] top-0.5 grid h-[17px] min-w-[17px] place-items-center rounded-full border-2 border-white bg-accent-500 px-1 text-[10px] font-bold text-white">
                  {p.globo}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
