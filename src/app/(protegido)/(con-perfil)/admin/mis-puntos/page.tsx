import { AvisoActividadAbierta } from "@/componentes/aviso-actividad-abierta";
import { RepartoPuntosExtra } from "@/componentes/reparto-puntos-extra";
import { TablaParticipacionesAlumno } from "@/componentes/tabla-participaciones";
import { obtenerActividadesDelAlumno } from "@/lib/actividades";
import { avisoEsUrgente } from "@/lib/puntos/calculo";
import { enGuatemala } from "@/lib/fechas";
import { obtenerEstadoPuntosExtra, obtenerParticipaciones } from "@/lib/puntos/consulta";
import { requireAdmin } from "@/lib/sesion";

export const dynamic = "force-dynamic";

/**
 * Espejo de /inicio para quien administra (mismo patron que /admin/mis-clases): quien
 * administra tambien cursa y necesita ver sus propios puntos sin salir del panel.
 */
export default async function MisPuntosAdminPage() {
  const alumnoActual = await requireAdmin();
  const [actividades, tabla, estadoExtra] = await Promise.all([
    obtenerActividadesDelAlumno(alumnoActual.id),
    obtenerParticipaciones(alumnoActual.id),
    obtenerEstadoPuntosExtra(alumnoActual.id),
  ]);
  const urgente = estadoExtra.fechaDeCorte ? avisoEsUrgente(new Date(), estadoExtra.fechaDeCorte) : false;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Mis puntos</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Tus propios puntos, los mismos que ve un alumno en su inicio.
        </p>
      </div>

      <AvisoActividadAbierta actividades={actividades} />

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-neutral-900">Tus puntos por clase</h2>
        <TablaParticipacionesAlumno tabla={tabla} />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-neutral-900">Puntos extra</h2>
        <div
          className={`rounded-md border px-4 py-3 ${
            estadoExtra.saldoDisponible > 0
              ? urgente
                ? "border-danger-300 bg-danger-50"
                : "border-primary-200 bg-primary-50"
              : "border-neutral-200 bg-neutral-50"
          }`}
        >
          <p
            className={`text-2xl font-semibold tabular-nums ${
              estadoExtra.saldoDisponible > 0
                ? urgente
                  ? "text-danger-700"
                  : "text-primary-800"
                : "text-neutral-700"
            }`}
          >
            {estadoExtra.saldoDisponible}
          </p>
          <p
            className={`text-sm ${
              estadoExtra.saldoDisponible > 0 ? (urgente ? "text-danger-700" : "text-primary-800") : "text-neutral-600"
            }`}
          >
            {estadoExtra.saldoDisponible === 1 ? "punto por asignar" : "puntos por asignar"}
          </p>
          {estadoExtra.saldoDisponible > 0 && estadoExtra.fechaDeCorte && estadoExtra.repartoAbierto && (
            <p className={`mt-1 text-xs ${urgente ? "font-medium text-danger-700" : "text-primary-700"}`}>
              {urgente ? "¡Se pierden si no repartís antes del " : "Repartilos antes del "}
              {enGuatemala(estadoExtra.fechaDeCorte)}
              {urgente ? "!" : "."}
            </p>
          )}
          {!estadoExtra.repartoAbierto && (
            <p className="mt-1 text-xs text-neutral-500">
              El reparto ya está cerrado
              {estadoExtra.fechaDeCorte ? ` desde el ${enGuatemala(estadoExtra.fechaDeCorte)}` : ""}.
            </p>
          )}
        </div>

        <RepartoPuntosExtra
          saldoDisponible={estadoExtra.saldoDisponible}
          asignaciones={estadoExtra.asignaciones}
          clasesParaRepartir={estadoExtra.clasesParaRepartir}
          repartoAbierto={estadoExtra.repartoAbierto}
        />
      </div>
    </div>
  );
}
