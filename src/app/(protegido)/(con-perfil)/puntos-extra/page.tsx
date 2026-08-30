import { NavAlumno } from "@/componentes/nav-alumno";
import { RepartoPuntosExtra } from "@/componentes/reparto-puntos-extra";
import { avisoEsUrgente } from "@/lib/puntos/calculo";
import { obtenerEstadoPuntosExtra } from "@/lib/puntos/consulta";
import { formatearFechaHora } from "@/lib/fecha";
import { requireAlumno } from "@/lib/sesion";

export const dynamic = "force-dynamic";

export default async function PuntosExtraPage() {
  const alumnoActual = await requireAlumno();
  const estado = await obtenerEstadoPuntosExtra(alumnoActual.id);
  const urgente = estado.fechaDeCorte ? avisoEsUrgente(new Date(), estado.fechaDeCorte) : false;

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 p-6">
      <NavAlumno />
      <div>
        <h1 className="text-xl font-semibold">Puntos extra</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Elegí en qué clase caen los puntos que ganás en las actividades extra.
        </p>
      </div>

      <div
        className={`rounded-md border px-4 py-3 ${
          estado.saldoDisponible > 0
            ? urgente
              ? "border-danger-300 bg-danger-50"
              : "border-primary-200 bg-primary-50"
            : "border-neutral-200 bg-neutral-50"
        }`}
      >
        <p
          className={`text-2xl font-semibold tabular-nums ${
            estado.saldoDisponible > 0 ? (urgente ? "text-danger-700" : "text-primary-800") : "text-neutral-700"
          }`}
        >
          {estado.saldoDisponible}
        </p>
        <p className={`text-sm ${estado.saldoDisponible > 0 ? (urgente ? "text-danger-700" : "text-primary-800") : "text-neutral-600"}`}>
          {estado.saldoDisponible === 1 ? "punto por asignar" : "puntos por asignar"}
        </p>
        {estado.saldoDisponible > 0 && estado.fechaDeCorte && estado.repartoAbierto && (
          <p className={`mt-1 text-xs ${urgente ? "font-medium text-danger-700" : "text-primary-700"}`}>
            {urgente ? "¡Se pierden si no repartís antes del " : "Repartilos antes del "}
            {formatearFechaHora(estado.fechaDeCorte)}
            {urgente ? "!" : "."}
          </p>
        )}
        {!estado.repartoAbierto && (
          <p className="mt-1 text-xs text-neutral-500">
            El reparto ya está cerrado{estado.fechaDeCorte ? ` desde el ${formatearFechaHora(estado.fechaDeCorte)}` : ""}.
          </p>
        )}
      </div>

      <RepartoPuntosExtra
        saldoDisponible={estado.saldoDisponible}
        asignaciones={estado.asignaciones}
        clasesParaRepartir={estado.clasesParaRepartir}
        repartoAbierto={estado.repartoAbierto}
      />
    </main>
  );
}
