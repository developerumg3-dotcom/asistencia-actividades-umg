import { ActivarAvisos } from "@/componentes/activar-avisos";
import { FormularioNotificacion } from "@/componentes/formulario-notificacion";
import { Titular } from "@/componentes/ui/titular";
import { clavePublicaVapid } from "@/lib/push/vapid";
import { requireAdmin } from "@/lib/sesion";

/**
 * B11 — Notificaciones: un aviso general escrito a mano. El de una actividad sigue saliendo
 * del boton "Avisar a los alumnos" en /admin/actividades.
 */
export default async function NotificacionesAdminPage() {
  // El layout ya lo pide, pero la pagina no depende de que el layout este: se pide aca tambien.
  await requireAdmin();

  return (
    <>
      <Titular titulo="Avisos" bajada="Una notificación a los teléfonos de quienes los activaron." />

      <FormularioNotificacion />

      {/*
        El mismo control que ve el alumno en /cuenta, pero aca.
        Los avisos salen a TODAS las suscripciones sin mirar el rol, asi que a una cuenta de
        administracion le llegan igual — pero solo si activo el permiso. Sin esto, el que manda
        los avisos es justamente el que no los recibe, y no tiene como comprobar que salieron
        ni usar «Probarlo conmigo».
      */}
      <ActivarAvisos clavePublica={clavePublicaVapid()} />
    </>
  );
}
