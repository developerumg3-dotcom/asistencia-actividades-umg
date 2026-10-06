import { redirect } from "next/navigation";

// Los puntos propios de quien administra son los mismos de un alumno: /inicio, con la barra
// del alumno y una cinta para volver al panel. Se conserva la ruta por si quedo guardada.
export default function MisPuntosAdminPage() {
  redirect("/inicio");
}
