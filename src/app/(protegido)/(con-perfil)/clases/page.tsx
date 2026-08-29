import { asc, eq } from "drizzle-orm";
import { db } from "@/db/cliente";
import { clase, docente, inscripcion } from "@/db/esquema";
import { SelectorClases } from "@/componentes/selector-clases";
import { requireAlumno } from "@/lib/sesion";

export default async function ClasesPage() {
  const alumnoActual = await requireAlumno();

  const [clasesDisponibles, inscripciones] = await Promise.all([
    db
      .select({
        id: clase.id,
        codigo: clase.codigo,
        nombre: clase.nombre,
        seccion: clase.seccion,
        jornada: clase.jornada,
        ciclo: clase.ciclo,
        docenteNombre: docente.nombre,
      })
      .from(clase)
      // leftJoin y no innerJoin: el catalogo del pensum se siembra sin catedratico
      // asignado (PLANIFICACION.md §4). Con innerJoin no se veria ninguna clase.
      .leftJoin(docente, eq(clase.docenteId, docente.id))
      .where(eq(clase.activa, true))
      .orderBy(asc(clase.codigo)),
    db.select({ claseId: inscripcion.claseId }).from(inscripcion).where(eq(inscripcion.alumnoId, alumnoActual.id)),
  ]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Tus clases</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Elegí los cursos que estás llevando este ciclo. Podés agregar o quitar cuando quieras.
        </p>
      </div>
      <SelectorClases
        clasesDisponibles={clasesDisponibles}
        idsInscritoInicial={inscripciones.map((i) => i.claseId)}
      />
    </main>
  );
}
