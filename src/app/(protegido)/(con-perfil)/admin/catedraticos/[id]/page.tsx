import { and, asc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db/cliente";
import { clase, docente } from "@/db/esquema";
import { clasesDeBoton } from "@/componentes/ui/boton";
import { Icono } from "@/componentes/ui/icono";
import { Tarjeta } from "@/componentes/ui/tarjeta";
import { SubBarra, TituloSeccion, Vacio } from "@/componentes/ui/titular";
import { enTitulo } from "@/lib/texto";

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
    <>
      <SubBarra titulo={unDocente.nombre} volverA="/admin/catedraticos" />
      {unDocente.email && <p className="text-[13px] text-neutral-500">{unDocente.email}</p>}

      <Tarjeta className="flex flex-col gap-3">
        <div>
          <h2 className="font-bold leading-snug">Reporte</h2>
          <p className="text-[13px] text-neutral-500">
            Un libro con una hoja por cada una de sus {clases.length === 1 ? "clase" : "clases"}, con los
            puntos de cada alumno.
          </p>
        </div>
        {clases.length === 0 ? (
          <p className="text-[13px] text-neutral-500">Todavía no tiene clases asignadas.</p>
        ) : (
          <a href={`/api/reportes/catedratico/${id}`} className={clasesDeBoton("primario")}>
            <Icono nombre="bajar" />
            Descargar reporte
          </a>
        )}
      </Tarjeta>

      <TituloSeccion lado={clases.length || undefined}>Clases</TituloSeccion>
      {clases.length === 0 ? (
        <Vacio>
          Asignale cursos desde{" "}
          <Link href="/admin/clases" className="font-semibold text-primary-700">
            Clases
          </Link>
          .
        </Vacio>
      ) : (
        <ul className="overflow-hidden rounded-2xl bg-white shadow-tarjeta">
          {clases.map((c) => (
            <li key={c.id} className="border-b border-linea px-3.5 py-3 last:border-b-0">
              <p className="text-[14.5px] font-bold leading-snug">{enTitulo(c.nombre)}</p>
              <p className="text-xs text-neutral-400">
                {c.codigo}
                {c.seccion && ` · Sección ${c.seccion}`} · {c.jornada} · Ciclo {c.ciclo}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
