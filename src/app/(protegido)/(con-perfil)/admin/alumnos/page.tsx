import { asc, ilike, or } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db/cliente";
import { alumno } from "@/db/esquema";
import { Boton } from "@/componentes/ui/boton";
import { Avatar } from "@/componentes/ui/avatar";
import { Etiqueta } from "@/componentes/ui/etiqueta";
import { Icono } from "@/componentes/ui/icono";
import { Titular, Vacio } from "@/componentes/ui/titular";

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
    <>
      <Titular titulo="Alumnos" bajada="Buscá para ver sus clases y puntos, corregir inscripciones o liberar un carné." />

      <form className="relative" action="/admin/alumnos">
        <Icono nombre="buscar" className="pointer-events-none absolute left-3.5 top-[13px] text-neutral-400" />
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={termino}
          placeholder="Carné, nombre o correo"
          aria-label="Buscar alumno"
          className="h-12 w-full rounded-[14px] bg-white pl-11 pr-24 text-base shadow-tarjeta outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
        />
        <Boton type="submit" tamano="chico" className="absolute right-1.5 top-1.5">
          Buscar
        </Boton>
      </form>

      {!termino && <Vacio>Escribí un carné, un nombre o un correo para encontrar a un alumno.</Vacio>}

      {termino && alumnos.length === 0 && <Vacio>No encontramos ningún alumno con ese criterio.</Vacio>}

      {alumnos.length > 0 && (
        <ul className="flex flex-col gap-2.5">
          {alumnos.map((a) => (
            <li key={a.id}>
              <Link
                href={`/admin/alumnos/${a.id}`}
                className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-tarjeta transition active:scale-[.985]"
              >
                <Avatar nombre={a.nombre} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold leading-snug">{a.nombre ?? a.email}</p>
                  <p className="truncate text-xs text-neutral-400">
                    {a.carne ?? "Perfil sin completar"} · {a.email}
                  </p>
                </div>
                {a.estado === "bloqueado" && <Etiqueta tono="rojo">Bloqueado</Etiqueta>}
                <Icono nombre="der" className="text-neutral-400" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
