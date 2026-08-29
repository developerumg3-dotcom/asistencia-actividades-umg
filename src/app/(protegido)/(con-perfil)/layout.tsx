import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BotonCerrarSesion } from "@/componentes/boton-cerrar-sesion";
import { requireAlumno } from "@/lib/sesion";

export const dynamic = "force-dynamic";

export default async function ConPerfilLayout({ children }: { children: ReactNode }) {
  const alumnoActual = await requireAlumno();
  if (!alumnoActual.perfilCompleto) redirect("/perfil/completar");

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between gap-4 border-b-2 border-primary-600 bg-white px-6 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Image src="/escudo-umg.webp" alt="" width={28} height={28} className="shrink-0" />
          <span className="truncate text-sm text-neutral-600">{alumnoActual.email}</span>
        </div>
        <div className="flex items-center gap-4">
          {alumnoActual.rol === "admin" && (
            <Link href="/admin/catedraticos" className="text-sm text-neutral-600 underline hover:text-primary-700">
              Administración
            </Link>
          )}
          <BotonCerrarSesion />
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
