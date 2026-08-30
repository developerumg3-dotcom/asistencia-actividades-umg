import { asc, eq } from "drizzle-orm";
import { db } from "@/db/cliente";
import { clase, docente } from "@/db/esquema";
import { FormularioNuevaClase } from "@/componentes/formulario-clase";
import { ImportarClasesCsv } from "@/componentes/importar-clases-csv";
import { ListaClasesAdmin } from "@/componentes/lista-clases-admin";

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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Clases</h1>
        <p className="mt-1 text-sm text-neutral-600">
          El catálogo del pensum. El catedrático y la sección se asignan acá, y hacen falta
          antes de exportar el Excel de esa clase.
        </p>
      </div>

      {sinCatedratico > 0 && (
        <p className="rounded-md border border-accent-300 bg-accent-50 px-4 py-3 text-sm text-accent-900">
          <strong className="font-semibold">{sinCatedratico}</strong> de {clases.length} clases no
          tienen catedrático asignado. Esas no se pueden exportar.
        </p>
      )}

      {/* Lado a lado cuando estan cerrados; al abrir uno, su formulario ocupa el ancho
          completo y el otro boton baja de renglon. */}
      <div className="flex flex-wrap justify-end gap-3">
        <FormularioNuevaClase docentes={docentes} />
        <ImportarClasesCsv />
      </div>

      {clases.length === 0 ? (
        <div className="rounded-md border border-dashed border-neutral-300 px-4 py-12 text-center">
          <p className="text-sm font-medium text-neutral-700">Todavía no hay clases cargadas.</p>
          <p className="mt-1 text-sm text-neutral-500">
            Sembrá el pensum con <code className="font-mono">pnpm db:sembrar</code> o importá un CSV.
          </p>
        </div>
      ) : (
        <ListaClasesAdmin clases={clases} docentes={docentes} />
      )}
    </div>
  );
}
