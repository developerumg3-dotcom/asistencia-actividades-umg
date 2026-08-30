import { NavAlumno } from "@/componentes/nav-alumno";
import { SelectorClases } from "@/componentes/selector-clases";
import { obtenerClasesDisponibles, obtenerIdsInscritoDe } from "@/lib/clases";
import { requireAlumno } from "@/lib/sesion";

export default async function ClasesPage() {
  const alumnoActual = await requireAlumno();

  const [clasesDisponibles, idsInscritoInicial] = await Promise.all([
    obtenerClasesDisponibles(),
    obtenerIdsInscritoDe(alumnoActual.id),
  ]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 p-6">
      <NavAlumno />
      <div>
        <h1 className="text-xl font-semibold">Tus clases</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Elegí los cursos que estás llevando este ciclo. Podés agregar o quitar cuando quieras.
        </p>
      </div>
      <SelectorClases
        clasesDisponibles={clasesDisponibles}
        idsInscritoInicial={idsInscritoInicial}
        cicloAlumno={alumnoActual.ciclo}
      />
    </main>
  );
}
