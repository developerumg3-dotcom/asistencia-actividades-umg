import { asc, eq } from "drizzle-orm";
import { db } from "@/db/cliente";
import { clase, docente } from "@/db/esquema";
import { FormularioNuevaClase } from "@/componentes/formulario-clase";
import { ImportarClasesCsv } from "@/componentes/importar-clases-csv";
import { ListaClasesAdmin } from "@/componentes/lista-clases-admin";
import { Icono } from "@/componentes/ui/icono";
import { SubBarra, Vacio } from "@/componentes/ui/titular";

export default async function ClasesAdminPage() {
  const [clases, docentes] = await Promise.all([
    db
      .select({
        id: clase.id,
        codigo: clase.codigo,
        nombre: clase.nombre,
        seccion: clase.seccion,
        jornada: clase.jornada,
        ciclo: clase.ciclo,
        activa: clase.activa,
        docenteId: clase.docenteId,
        docenteNombre: docente.nombre,
      })
      .from(clase)
      .leftJoin(docente, eq(clase.docenteId, docente.id))
      .orderBy(asc(clase.codigo)),
    db.select({ id: docente.id, nombre: docente.nombre }).from(docente).orderBy(asc(docente.nombre)),
  ]);

  const sinCatedratico = clases.filter((c) => !c.docenteId).length;

  return (
    <>
      <SubBarra titulo="Clases" volverA="/admin/mas" />
      <p className="text-[13px] text-neutral-500">
        El catálogo del pensum. El catedrático y la sección se asignan acá, y hacen falta antes de
        exportar el Excel de esa clase.
      </p>

      {sinCatedratico > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-accent-100 bg-accent-50 px-4 py-3.5 text-[13.5px] text-accent-700">
          <Icono nombre="alerta" />
          <p>
            <strong className="font-bold">
              {sinCatedratico} de {clases.length}
            </strong>{" "}
            clases no tienen catedrático asignado. Esas no se pueden exportar.
          </p>
        </div>
      )}

      {/* Lado a lado cuando estan cerrados; al abrir uno, su formulario ocupa el ancho
          completo y el otro boton baja de renglon. */}
      <div className="flex flex-wrap gap-2.5">
        <FormularioNuevaClase docentes={docentes} />
        <ImportarClasesCsv />
      </div>

      {clases.length === 0 ? (
        <Vacio>
          <p className="font-bold text-tinta">Todavía no hay clases cargadas</p>
          <p className="mt-1">
            Sembrá el pensum con <code className="font-mono">pnpm db:sembrar</code> o importá un CSV.
          </p>
        </Vacio>
      ) : (
        <ListaClasesAdmin clases={clases} docentes={docentes} />
      )}
    </>
  );
}
