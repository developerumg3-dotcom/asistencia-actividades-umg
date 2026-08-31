import { asc, ilike, or } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db/cliente";
import { alumno } from "@/db/esquema";
import { Boton } from "@/componentes/ui/boton";
import { Campo } from "@/componentes/ui/campo";

const LIMITE_RESULTADOS = 50;

/** B7 — buscar un alumno por carné, nombre o correo. Sin termino no lista a nadie: la tabla
 * crece con cada registro abierto y no tiene sentido volcarla entera. */
export default async function AlumnosAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const termino = q?.trim() ?? "";

  const alumnos = termino
    ? await db
        .select({ id: alumno.id, carne: alumno.carne, nombre: alumno.nombre, email: alumno.email, estado: alumno.estado })
        .from(alumno)
        .where(
          or(
            ilike(alumno.carne, `%${termino}%`),
            ilike(alumno.nombre, `%${termino}%`),
            ilike(alumno.email, `%${termino}%`),
          ),
        )
        .orderBy(asc(alumno.nombre))
        .limit(LIMITE_RESULTADOS)
    : [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Alumnos</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Buscar para ver sus clases y puntos, corregir inscripciones o liberar un carné.
        </p>
      </div>

      <form className="flex gap-2" action="/admin/alumnos">
        <Campo
          id="q"
          name="q"
          type="search"
          defaultValue={termino}
          placeholder="Carné, nombre o correo…"
          className="flex-1"
        />
        <Boton type="submit">Buscar</Boton>
      </form>

      {termino && alumnos.length === 0 && (
        <div className="rounded-md border border-dashed border-neutral-300 px-4 py-10 text-center">
          <p className="text-sm text-neutral-600">No encontramos ningún alumno con ese criterio.</p>
        </div>
      )}

      {alumnos.length > 0 && (
        <ul className="flex flex-col gap-2">
          {alumnos.map((a) => (
            <li key={a.id}>
              <Link
                href={`/admin/alumnos/${a.id}`}
                className="flex items-center justify-between gap-3 rounded-md border border-neutral-200 bg-white px-4 py-3 hover:border-primary-300 hover:bg-neutral-50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-neutral-900">{a.nombre ?? a.email}</p>
                  <p className="truncate text-sm text-neutral-500">
                    {a.carne ?? "Sin carné"} · {a.email}
                  </p>
                </div>
                {a.estado === "bloqueado" && (
                  <span className="shrink-0 rounded-full bg-danger-100 px-2 py-0.5 text-xs font-medium text-danger-700">
                    Bloqueado
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
