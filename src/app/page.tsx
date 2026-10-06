import { redirect } from "next/navigation";
import { obtenerAlumnoActual } from "@/lib/sesion";

// "/" no es una pantalla: solo redirige a donde corresponda según el estado de la cuenta.
export const dynamic = "force-dynamic";

export default async function RaizPage() {
  const alumnoActual = await obtenerAlumnoActual();
  if (!alumnoActual) redirect("/ingreso");
  if (!alumnoActual.perfilCompleto) redirect("/perfil/completar");
  // El administrador entra a su panel, por el Tablero: si hay una actividad con el marcaje
  // abierto, ahi la tiene con sus dos atajos (en vivo y kiosco). Sus propios puntos estan en
  // Más → Mis puntos.
  if (alumnoActual.rol === "admin") redirect("/admin");
  // El alumno ya eligio sus cursos al crear la cuenta (A3), asi que mandarlo de nuevo a esa
  // pantalla no le dice nada. Lo que necesita al entrar son sus puntos.
  redirect("/inicio");
}
