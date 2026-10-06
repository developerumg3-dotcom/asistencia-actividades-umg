import { FormularioNotificacion } from "@/componentes/formulario-notificacion";
import { requireAdmin } from "@/lib/sesion";

/**
 * B11 — Notificaciones: un aviso general escrito a mano. El de una actividad sigue saliendo
 * del boton "Avisar a los alumnos" en /admin/actividades.
 */
export default async function NotificacionesAdminPage() {
  // El layout ya lo pide, pero la pagina no depende de que el layout este: se pide aca tambien.
  await requireAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Notificaciones</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Escribí un aviso general y mandalo como notificación a los teléfonos. Antes de enviar
          vas a ver a cuántos alumnos les llega de verdad.
        </p>
      </div>

      <FormularioNotificacion />
    </div>
  );
}
