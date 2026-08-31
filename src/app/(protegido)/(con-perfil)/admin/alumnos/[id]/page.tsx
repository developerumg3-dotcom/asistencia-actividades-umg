import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db/cliente";
import { alumno } from "@/db/esquema";
import { FormularioLiberarCarne } from "@/componentes/formulario-liberar-carne";
import { SelectorClasesAdmin } from "@/componentes/selector-clases-admin";
import { obtenerClasesDisponibles, obtenerIdsInscritoDe } from "@/lib/clases";
import { obtenerParticipaciones } from "@/lib/puntos/consulta";

/** B7 — ficha de un alumno: sus clases y puntos, corregir inscripciones, liberar el carné. */
export default async function DetalleAlumnoAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [unAlumno] = await db.select().from(alumno).where(eq(alumno.id, id)).limit(1);
  if (!unAlumno) notFound();

  const [tabla, clasesDisponibles, idsInscrito] = await Promise.all([
    obtenerParticipaciones(id),
    obtenerClasesDisponibles(),
    obtenerIdsInscritoDe(id),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/alumnos" className="text-sm text-primary-700 underline">
          ← Alumnos
        </Link>
        <h1 className="mt-2 text-xl font-semibold">{unAlumno.nombre ?? unAlumno.email}</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {unAlumno.email} · Ciclo {unAlumno.ciclo ?? "sin declarar"}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 bg-white p-4">
        <div>
          <p className="text-sm text-neutral-600">Carné</p>
          <p className="font-mono text-lg text-neutral-900">{unAlumno.carne ?? "—"}</p>
        </div>
        {unAlumno.carne && <FormularioLiberarCarne alumnoId={unAlumno.id} carne={unAlumno.carne} />}
      </div>

      <div>
        <h2 className="font-medium text-neutral-900">Clases y puntos</h2>
        {tabla.filas.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">Todavía no está inscrito en ninguna clase.</p>
        ) : (
          <div className="-mx-6 mt-2 overflow-x-auto px-6">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-neutral-500">
                  <th className="py-2 pr-4 font-medium">Clase</th>
                  {tabla.columnas.map((actividad) => (
                    <th key={actividad.id} className="px-2 py-2 text-center font-medium">
                      {actividad.nombre}
                    </th>
                  ))}
                  <th className="px-2 py-2 text-center font-medium">Extra</th>
                  <th className="pl-2 py-2 text-center font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {tabla.filas.map((fila) => (
                  <tr key={fila.claseId} className="border-b border-neutral-100">
                    <td className="py-2 pr-4 font-medium text-neutral-900">{fila.claseNombre}</td>
                    {tabla.columnas.map((actividad) => (
                      <td key={actividad.id} className="px-2 py-2 text-center tabular-nums text-neutral-700">
                        {fila.marcas[actividad.id]}
                      </td>
                    ))}
                    <td className="px-2 py-2 text-center tabular-nums text-neutral-700">{fila.extra}</td>
                    <td className="pl-2 py-2 text-center text-base font-semibold tabular-nums text-primary-700">
                      {fila.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="font-medium text-neutral-900">Corregir inscripciones</h2>
        <p className="mt-1 text-sm text-neutral-600">Agregar o quitar clases de este alumno.</p>
        <div className="mt-3">
          <SelectorClasesAdmin alumnoId={id} clasesDisponibles={clasesDisponibles} idsInscritoInicial={idsInscrito} />
        </div>
      </div>
    </div>
  );
}
