"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const pestanas = [
  { href: "/admin/catedraticos", etiqueta: "Catedráticos" },
  { href: "/admin/clases", etiqueta: "Clases" },
];

export function NavAdmin() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 border-b border-neutral-200 text-sm font-medium">
      {pestanas.map((p) => {
        const activa = pathname.startsWith(p.href);
        return (
          <Link
            key={p.href}
            href={p.href}
            className={
              activa
                ? "rounded-t-md border-b-2 border-primary-600 px-3 py-2 text-primary-700"
                : "rounded-t-md px-3 py-2 text-neutral-600 hover:bg-primary-50 hover:text-primary-700"
            }
          >
            {p.etiqueta}
          </Link>
        );
      })}
      <Link href="/clases" className="ml-auto text-neutral-500 underline hover:text-primary-700">
        Mis clases
      </Link>
    </nav>
  );
}
