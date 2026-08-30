import { redirect } from "next/navigation";
import { obtenerAlumnoActual } from "@/lib/sesion";

// A5 (Inicio) no entra en esta fase (ver docs/fase-1.md). "/" solo redirige a donde
// corresponda según el estado de la cuenta.
export const dynamic = "force-dynamic";

export default async function RaizPage() {
  const alumnoActual = await obtenerAlumnoActual();
  if (!alumnoActual) redirect("/ingreso");
  if (!alumnoActual.perfilCompleto) redirect("/perfil/completar");
  // El administrador entra a su panel: durante un evento lo que necesita es la actividad,
  // no sus propias clases. Sigue llegando a /clases por "Mis clases" en la barra del panel.
  if (alumnoActual.rol === "admin") redirect("/admin/actividades");
  redirect("/clases");
}
