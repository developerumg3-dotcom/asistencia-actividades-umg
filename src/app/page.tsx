import { redirect } from "next/navigation";
import { obtenerAlumnoActual } from "@/lib/sesion";

// A5 (Inicio) no entra en esta fase (ver docs/fase-1.md). "/" solo redirige a donde
// corresponda según el estado de la cuenta.
export const dynamic = "force-dynamic";

export default async function RaizPage() {
  const alumnoActual = await obtenerAlumnoActual();
  if (!alumnoActual) redirect("/ingreso");
  if (!alumnoActual.perfilCompleto) redirect("/perfil/completar");
  redirect("/clases");
}
