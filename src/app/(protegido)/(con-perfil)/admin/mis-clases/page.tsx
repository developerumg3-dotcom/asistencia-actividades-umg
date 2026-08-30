import { SelectorClases } from "@/componentes/selector-clases";
import { obtenerClasesDisponibles, obtenerIdsInscritoDe } from "@/lib/clases";
import { requireAdmin } from "@/lib/sesion";

/**
 * Los mismos cursos propios que ve un alumno en /clases, pero dentro del panel. Quien
 * administra tambien cursa: necesita elegir sus clases sin que eso lo saque de sus
 * herramientas y le haga perder la barra de pestañas.
 */
export default async function MisClasesAdminPage() {
  const alumnoActual = await requireAdmin();

  const [clasesDisponibles, idsInscrito] = await Promise.all([
    obtenerClasesDisponibles(),
    obtenerIdsInscritoDe(alumnoActual.id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Mis clases</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Los cursos que vos cursás. Nada que ver con el catálogo de la pestaña «Clases»: esto
          es tu propia inscripción, la que decide en qué clases se te acreditan los puntos.
        </p>
      </div>
      <SelectorClases
        clasesDisponibles={clasesDisponibles}
        idsInscritoInicial={idsInscrito}
        cicloAlumno={alumnoActual.ciclo}
      />
    </div>
  );
}
