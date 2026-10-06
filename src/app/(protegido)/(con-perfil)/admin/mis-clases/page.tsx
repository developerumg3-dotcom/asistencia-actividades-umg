import { redirect } from "next/navigation";

// Igual que /admin/mis-puntos: los cursos propios viven en /clases.
export default function MisClasesAdminPage() {
  redirect("/clases");
}
