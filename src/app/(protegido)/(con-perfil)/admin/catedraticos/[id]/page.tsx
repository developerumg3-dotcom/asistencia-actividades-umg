import { and, asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db/cliente";
import { clase, docente } from "@/db/esquema";

/**
 * B2 (vista por docente, §8) + B10 (Fase 4): sus clases y el botón para descargar su Excel.
 * No existía todavía — la lista de `/admin/catedraticos` era plana, sin detalle.
 */
export default async function DetalleCatedraticoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [unDocente] = await db.select().from(docente).where(eq(docente.id, id)).limit(1);
  if (!unDocente) notFound();

  const clases = await db
    .select({ id: clase.id, codigo: clase.codigo, nombre: clase.nombre, seccion: clase.seccion, jornada: clase.jornada, ciclo: clase.ciclo })
    .from(clase)
    .where(and(eq(clase.docenteId, id), eq(clase.activa, true)))
    .orderBy(asc(clase.codigo));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/catedraticos" className="text-sm text-primary-700 underline">
          ← Catedráticos
        </Link>
        <h1 className="mt-2 text-xl font-semibold">{unDocente.nombre}</h1>
        {unDocente.email && <p className="mt-1 text-sm text-neutral-600">{unDocente.email}</p>}
      </div>

      <div className="rounded-md border border-neutral-200 bg-white p-4">
        <h2 className="font-medium text-neutral-900">Reporte</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Un libro con una hoja por cada una de sus {clases.length === 1 ? "clase" : "clases"}, con los
          puntos de cada alumno.
        </p>
        {clases.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">Todavía no tiene clases asignadas.</p>
        ) : (
          <a
            href={`/api/reportes/catedratico/${id}`}
            className="mt-3 inline-block rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Descargar reporte
          </a>
        )}
      </div>

      <div>
        <h2 className="font-medium text-neutral-900">Clases</h2>
        {clases.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-500">
            Asignale cursos desde <Link href="/admin/clases" className="text-primary-700 underline">Clases</Link>.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {clases.map((c) => (
              <li key={c.id} className="rounded-md border border-neutral-200 bg-white px-4 py-3">
                <p className="font-medium text-neutral-900">{c.nombre}</p>
                <p className="text-xs text-neutral-500">
                  {c.codigo}
                  {c.seccion && ` · Sección ${c.seccion}`} · {c.jornada} · Ciclo {c.ciclo}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
