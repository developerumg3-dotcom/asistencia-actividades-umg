import { asc } from "drizzle-orm";
import { db } from "@/db/cliente";
import { clase, docente } from "@/db/esquema";
import { FilaClase, FormularioNuevaClase } from "@/componentes/formulario-clase";
import { ImportarClasesCsv } from "@/componentes/importar-clases-csv";

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
      })
      .from(clase)
      .orderBy(asc(clase.nombre)),
    db.select({ id: docente.id, nombre: docente.nombre }).from(docente).orderBy(asc(docente.nombre)),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Clases</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Cada clase se asocia a un catedrático. Alta manual o importación por CSV.
        </p>
      </div>

      <FormularioNuevaClase docentes={docentes} />
      <ImportarClasesCsv />

      <div className="flex flex-col">
        {clases.length === 0 && <p className="text-sm text-neutral-500">Todavía no hay clases cargadas.</p>}
        {clases.map((c) => (
          <FilaClase key={c.id} {...c} docentes={docentes} />
        ))}
      </div>
    </div>
  );
}
