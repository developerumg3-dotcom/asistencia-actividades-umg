import { asc, count, eq } from "drizzle-orm";
import { db } from "@/db/cliente";
import { clase, docente } from "@/db/esquema";
import { FilaCatedratico, FormularioNuevoCatedratico } from "@/componentes/formulario-catedratico";

export default async function CatedraticosPage() {
  const docentes = await db
    .select({
      id: docente.id,
      nombre: docente.nombre,
      email: docente.email,
      clases: count(clase.id),
    })
    .from(docente)
    .leftJoin(clase, eq(clase.docenteId, docente.id))
    .groupBy(docente.id)
    .orderBy(asc(docente.nombre));

  const sinClases = docentes.filter((d) => d.clases === 0).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Catedráticos</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {docentes.length === 0
            ? "Cada clase se asocia a un catedrático, y cada catedrático recibe su Excel."
            : `${docentes.length} ${docentes.length === 1 ? "catedrático" : "catedráticos"}${
                sinClases > 0 ? ` · ${sinClases} sin clases asignadas` : ""
              }`}
        </p>
      </div>

      <FormularioNuevoCatedratico />

      {docentes.length === 0 ? (
        <div className="rounded-md border border-dashed border-neutral-300 px-4 py-12 text-center">
          <p className="text-sm font-medium text-neutral-700">Todavía no hay catedráticos.</p>
          <p className="mt-1 text-sm text-neutral-500">
            Sin catedrático, una clase no se puede exportar a Excel.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {docentes.map((d) => (
            <FilaCatedratico key={d.id} id={d.id} nombre={d.nombre} email={d.email} clases={d.clases} />
          ))}
        </div>
      )}
    </div>
  );
}
