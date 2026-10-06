import { ActivarAvisos } from "@/componentes/activar-avisos";
import { FormularioNotificacion } from "@/componentes/formulario-notificacion";
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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Notificaciones</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Escribí un aviso general y mandalo como notificación a los teléfonos. Antes de enviar
          vas a ver a cuántas cuentas les llega de verdad.
        </p>
      </div>

      <FormularioNotificacion />

      {/*
        El mismo control que ve el alumno al final de /inicio, pero aca.
        Los avisos salen a TODAS las suscripciones sin mirar el rol, asi que a una cuenta de
        administracion le llegan igual — pero solo si activo el permiso, y quien administra no
        suele pasar por /inicio. Sin esto, el que manda los avisos es justamente el que no los
        recibe, y no tiene como comprobar que salieron.
      */}
      <section className="rounded-lg border border-neutral-200 p-4">
        <h2 className="text-sm font-semibold text-neutral-900">Tus avisos en este dispositivo</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Activalos para recibir vos también lo que se manda desde acá, y para poder usar
          «Probarlo conmigo». En iPhone hace falta tener la app instalada en la pantalla de
          inicio.
        </p>
        <div className="mt-3">
          <ActivarAvisos clavePublica={clavePublicaVapid()} />
        </div>
      </section>
    </div>
  );
}
