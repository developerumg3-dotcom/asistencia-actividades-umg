"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const pestanas = [
  { href: "/admin/actividades", etiqueta: "Actividades" },
  { href: "/admin/catedraticos", etiqueta: "Catedráticos" },
  { href: "/admin/clases", etiqueta: "Clases" },
  // Los cursos propios de quien administra. Es una pestaña mas y no un enlace de salida:
  // mandarlo a /clases lo sacaba del panel y le hacia perder estas opciones.
  { href: "/admin/mis-clases", etiqueta: "Mis clases" },
];

export function NavAdmin() {
  const pathname = usePathname();

  return (
    // En un telefono las cuatro entradas no caben: la barra se desplaza en vez de partirse.
    <nav className="-mx-6 flex items-center gap-1 overflow-x-auto border-b border-neutral-200 px-6 text-sm font-medium sm:mx-0 sm:px-0">
      {pestanas.map((p) => {
        const activa = pathname.startsWith(p.href);
        return (
          <Link
            key={p.href}
            href={p.href}
            className={
              activa
                ? "shrink-0 whitespace-nowrap rounded-t-md border-b-2 border-primary-600 px-3 py-2 text-primary-700"
                : "shrink-0 whitespace-nowrap rounded-t-md px-3 py-2 text-neutral-600 hover:bg-primary-50 hover:text-primary-700"
            }
          >
            {p.etiqueta}
          </Link>
        );
      })}
    </nav>
  );
}
