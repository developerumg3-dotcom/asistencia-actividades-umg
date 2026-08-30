"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const pestanas = [
  { href: "/clases", etiqueta: "Mis clases" },
  { href: "/participaciones", etiqueta: "Participaciones" },
  { href: "/puntos-extra", etiqueta: "Puntos extra" },
];

/**
 * A5 (Inicio) todavia no existe — es tarea de la Fase 2 — asi que por ahora esta es la unica
 * forma de moverse entre las pantallas del alumno sin escribir la URL a mano.
 */
export function NavAlumno() {
  const pathname = usePathname();

  return (
    <nav className="-mx-6 flex items-center gap-1 overflow-x-auto border-b border-neutral-200 px-6 text-sm font-medium">
      {pestanas.map((p) => {
        const activa = pathname.startsWith(p.href);
        return (
          <Link
            key={p.href}
            href={p.href}
            className={
              activa
                ? "shrink-0 rounded-t-md border-b-2 border-primary-600 px-3 py-2 text-primary-700"
                : "shrink-0 rounded-t-md px-3 py-2 text-neutral-600 hover:bg-primary-50 hover:text-primary-700"
            }
          >
            {p.etiqueta}
          </Link>
        );
      })}
    </nav>
  );
}
