import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db/cliente";
import { alumno } from "@/db/esquema";
import { FormularioLiberarCarne } from "@/componentes/formulario-liberar-carne";
import { SelectorClasesAdmin } from "@/componentes/selector-clases-admin";
import { Avatar } from "@/componentes/ui/avatar";
import { Tarjeta } from "@/componentes/ui/tarjeta";
import { SubBarra, TituloSeccion, Vacio } from "@/componentes/ui/titular";
import { obtenerClasesDisponibles, obtenerIdsInscritoDe } from "@/lib/clases";
import { obtenerParticipaciones } from "@/lib/puntos/consulta";
import { enTitulo } from "@/lib/texto";

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

  const asistidas = tabla.filas[0] ? tabla.columnas.filter((c) => tabla.filas[0].marcas[c.id] === 1).length : null;

  return (
    <>
      <SubBarra titulo="Ficha del alumno" volverA="/admin/alumnos" />

      <Tarjeta className="flex items-center gap-3">
        <Avatar nombre={unAlumno.nombre} tono="azul" className="!size-14 !text-lg" />
        <div className="min-w-0">
          <p className="text-[17px] font-bold leading-snug">{unAlumno.nombre ?? "Sin nombre"}</p>
          <p className="text-[13px] text-neutral-500">
            Carné <span className="font-mono">{unAlumno.carne ?? "—"}</span> · Ciclo {unAlumno.ciclo ?? "sin declarar"}
          </p>
          <p className="truncate text-xs text-neutral-400">{unAlumno.email}</p>
        </div>
      </Tarjeta>

      <TituloSeccion
        lado={asistidas !== null ? `asistió a ${asistidas} de ${tabla.columnas.length} actividades` : undefined}
      >
        Puntos por clase
      </TituloSeccion>
      {tabla.filas.length === 0 ? (
        <Vacio>Todavía no está inscrito en ninguna clase. Sus asistencias igual están guardadas.</Vacio>
      ) : (
        <ul className="overflow-hidden rounded-2xl bg-white shadow-tarjeta">
          {tabla.filas.map((fila) => {
            const deActividades = fila.total - fila.extra;
            return (
              <li key={fila.claseId} className="flex items-center gap-3 border-b border-linea px-3.5 py-3 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px] font-bold leading-snug">{enTitulo(fila.claseNombre)}</p>
                  <p className="text-xs text-neutral-400">
                    {fila.claseCodigo} · {deActividades} de actividades
                    {fila.extra > 0 && ` + ${fila.extra} extra`}
                  </p>
                </div>
                <b className="text-2xl font-extrabold tabular-nums text-primary-700">{fila.total}</b>
              </li>
            );
          })}
        </ul>
      )}

      {unAlumno.carne && (
        <Tarjeta className="flex flex-col gap-2.5">
          <div>
            <p className="font-bold leading-snug">Liberar carné</p>
            <p className="text-[13px] text-neutral-500">
              Si alguien registró este carné por error, liberarlo deja que su dueño lo use.
            </p>
          </div>
          <FormularioLiberarCarne alumnoId={unAlumno.id} carne={unAlumno.carne} />
        </Tarjeta>
      )}

      <TituloSeccion>Corregir inscripciones</TituloSeccion>
      <SelectorClasesAdmin alumnoId={id} clasesDisponibles={clasesDisponibles} idsInscritoInicial={idsInscrito} />
    </>
  );
}
