import { RepartoPuntosExtra } from "@/componentes/reparto-puntos-extra";
import { EnlaceBoton } from "@/componentes/ui/boton";
import { Pantalla } from "@/componentes/ui/pantalla";
import { Titular, Vacio } from "@/componentes/ui/titular";
import { enGuatemala } from "@/lib/fechas";
import { avisoEsUrgente } from "@/lib/puntos/calculo";
import { obtenerEstadoPuntosExtra, obtenerParticipaciones } from "@/lib/puntos/consulta";
import { requireAlumno } from "@/lib/sesion";
import { enTitulo } from "@/lib/texto";

export const dynamic = "force-dynamic";

/** A10 — Puntos extra: el saldo y a que clase va cada punto, con deshacer hasta el corte. */
export default async function PuntosExtraPage() {
  const alumnoActual = await requireAlumno();
  const [estado, tabla] = await Promise.all([
    obtenerEstadoPuntosExtra(alumnoActual.id),
    obtenerParticipaciones(alumnoActual.id),
  ]);
  const urgente = estado.fechaDeCorte ? avisoEsUrgente(new Date(), estado.fechaDeCorte) : false;
  const filaDe = new Map(tabla.filas.map((f) => [f.claseId, f]));
  const haySaldo = estado.saldoDisponible > 0;

  return (
    <Pantalla>
      <Titular titulo="Puntos extra" bajada="Los ganás en actividades especiales y vos decidís a qué clase van." />

      <div className="flex items-center gap-4 rounded-2xl border border-accent-100 bg-accent-50 p-4">
        <div className="grid size-[92px] shrink-0 place-items-center rounded-full border-[5px] border-accent-500 bg-white">
          <b className="text-[42px] font-extrabold leading-none tabular-nums tracking-tight text-accent-700">
            {estado.saldoDisponible}
          </b>
        </div>
        <div className="min-w-0">
          <p className="text-[11.5px] font-bold uppercase tracking-wider text-accent-700">Saldo por repartir</p>
          <p className="mt-1 font-bold leading-snug">
            {!estado.repartoAbierto
              ? "El reparto ya está cerrado."
              : haySaldo
                ? "Tocá +1 en la clase que quieras."
                : estado.asignaciones.length > 0
                  ? "Ya repartiste todo tu saldo."
                  : "Todavía no ganaste puntos extra."}
          </p>
          {estado.fechaDeCorte && (haySaldo || !estado.repartoAbierto) && (
            <p className={`mt-0.5 text-[13px] ${urgente && haySaldo && estado.repartoAbierto ? "font-semibold text-danger-600" : "text-neutral-500"}`}>
              {!estado.repartoAbierto
                ? `Cerró el ${enGuatemala(estado.fechaDeCorte)}`
                : urgente
                  ? `¡Se pierden si no los repartís antes del ${enGuatemala(estado.fechaDeCorte)}!`
                  : `Se pierden si no los repartís antes del ${enGuatemala(estado.fechaDeCorte)}`}
            </p>
          )}
        </div>
      </div>

      {estado.clasesParaRepartir.length === 0 && (
        <Vacio>
          <p className="font-bold text-tinta">Todavía no elegiste tus cursos</p>
          <p className="mt-1">Para repartir puntos extra necesitás estar inscrito en al menos un curso.</p>
          <EnlaceBoton href="/clases" tamano="chico" className="mt-3">
            Elegir mis cursos
          </EnlaceBoton>
        </Vacio>
      )}

      <RepartoPuntosExtra
        saldoDisponible={estado.saldoDisponible}
        repartoAbierto={estado.repartoAbierto}
        clases={estado.clasesParaRepartir.map((c) => ({
          id: c.id,
          nombre: enTitulo(c.nombre),
          total: filaDe.get(c.id)?.total ?? 0,
          extra: filaDe.get(c.id)?.extra ?? 0,
        }))}
        asignaciones={estado.asignaciones.map((a) => ({
          id: a.id,
          claseNombre: enTitulo(a.claseNombre),
          puntos: a.puntos,
          cuando: enGuatemala(a.creadaEn),
        }))}
      />
    </Pantalla>
  );
}
