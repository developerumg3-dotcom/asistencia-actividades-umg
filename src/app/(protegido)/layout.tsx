import type { ReactNode } from "react";
import { requireAlumno } from "@/lib/sesion";

export const dynamic = "force-dynamic";

// Exige sesión para todo lo que cuelga de este grupo. El chequeo de perfil completo vive un
// nivel más adentro, en (con-perfil)/layout.tsx, para que /perfil/completar sea alcanzable
// sin quedar atrapado en su propio redirect.
export default async function ProtegidoLayout({ children }: { children: ReactNode }) {
  await requireAlumno();
  return children;
}
