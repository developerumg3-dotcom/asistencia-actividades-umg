import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireAlumno } from "@/lib/sesion";

export const dynamic = "force-dynamic";

// Solo exige el perfil completo. La barra inferior la pone cada grupo: (alumno)/layout.tsx
// la del alumno y admin/layout.tsx la del panel. Ya no hay encabezado con el correo arriba.
export default async function ConPerfilLayout({ children }: { children: ReactNode }) {
  const alumnoActual = await requireAlumno();
  if (!alumnoActual.perfilCompleto) redirect("/perfil/completar");
  return children;
}
