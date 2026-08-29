import type { ReactNode } from "react";
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
      <header className="flex items-center justify-between gap-4 border-b border-neutral-200 px-6 py-3">
        <span className="truncate text-sm text-neutral-600">{alumnoActual.email}</span>
        <div className="flex items-center gap-4">
          {alumnoActual.rol === "admin" && (
            <Link href="/admin/catedraticos" className="text-sm text-neutral-600 underline">
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
