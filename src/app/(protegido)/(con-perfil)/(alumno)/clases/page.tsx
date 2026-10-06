import { SelectorClases } from "@/componentes/selector-clases";
import { Pantalla } from "@/componentes/ui/pantalla";
import { Titular } from "@/componentes/ui/titular";
import { obtenerClasesDisponibles, obtenerIdsInscritoDe } from "@/lib/clases";
import { requireAlumno } from "@/lib/sesion";

/** A4 + A8 — Mis cursos: elegir y cambiar los cursos que lleva el alumno. Se guarda solo. */
export default async function ClasesPage() {
  const alumnoActual = await requireAlumno();

  const [clasesDisponibles, idsInscritoInicial] = await Promise.all([
    obtenerClasesDisponibles(),
    obtenerIdsInscritoDe(alumnoActual.id),
  ]);

  return (
    <Pantalla>
      <Titular titulo="Mis cursos" bajada="Marcá los que llevás este ciclo. Se guarda solo." />
      <SelectorClases
        clasesDisponibles={clasesDisponibles}
        idsInscritoInicial={idsInscritoInicial}
        cicloAlumno={alumnoActual.ciclo}
      />
    </Pantalla>
  );
}
