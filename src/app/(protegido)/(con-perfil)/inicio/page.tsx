import Link from "next/link";
import { ActivarAvisos } from "@/componentes/activar-avisos";
import { AvisoActividadAbierta } from "@/componentes/aviso-actividad-abierta";
import { RepartoPuntosExtra } from "@/componentes/reparto-puntos-extra";
import { TablaParticipacionesAlumno } from "@/componentes/tabla-participaciones";
import { obtenerActividadesDelAlumno } from "@/lib/actividades";
import { avisoEsUrgente } from "@/lib/puntos/calculo";
import { enGuatemala } from "@/lib/fechas";
import { clavePublicaVapid } from "@/lib/push/vapid";
import { obtenerEstadoPuntosExtra, obtenerParticipaciones } from "@/lib/puntos/consulta";
import { requireAlumno } from "@/lib/sesion";

export const dynamic = "force-dynamic";

/**
 * A5 — Inicio del alumno. Fusiona lo que antes eran tres pantallas (A5 + A9 + A10, ver
 * docs/plan-rediseno-pantalla-alumno.md): lo primero que importa es cuantos puntos llevas en
 * cada clase, no si hay marcaje abierto ahora mismo — eso es un aviso, no el protagonista.
 */
export default async function InicioPage() {
  const alumnoActual = await requireAlumno();
  const [actividades, tabla, estadoExtra] = await Promise.all([
    obtenerActividadesDelAlumno(alumnoActual.id),
    obtenerParticipaciones(alumnoActual.id),
    obtenerEstadoPuntosExtra(alumnoActual.id),
  ]);
  const urgente = estadoExtra.fechaDeCorte ? avisoEsUrgente(new Date(), estadoExtra.fechaDeCorte) : false;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">
          Hola{alumnoActual.nombre ? `, ${alumnoActual.nombre.split(" ")[0]}` : ""}
        </h1>
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

      {/*
        Discreto y al final, nunca arriba y nunca automatico: el navegador pregunta el permiso
        una sola vez en la vida y un "Bloquear" deja al alumno inalcanzable para siempre.
        Ver docs/plan-notificaciones-push.md.
      */}
      <div className="border-t border-neutral-200 pt-4">
        <ActivarAvisos clavePublica={clavePublicaVapid()} />
      </div>

      <div className="flex flex-col gap-1">
        <Link href="/clases" className="text-sm text-primary-700 underline hover:text-primary-800">
          Mis cursos
        </Link>
        <Link
          href="/ayuda/instalar-ios"
          className="text-sm text-neutral-600 underline hover:text-primary-700"
        >
          ¿Cómo instalo esta app en mi iPhone?
        </Link>
      </div>
    </main>
  );
}
