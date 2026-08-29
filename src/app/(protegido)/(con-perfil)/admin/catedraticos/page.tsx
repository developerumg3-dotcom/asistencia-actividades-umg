import { asc } from "drizzle-orm";
import { db } from "@/db/cliente";
import { docente } from "@/db/esquema";
import { FilaCatedratico, FormularioNuevoCatedratico } from "@/componentes/formulario-catedratico";

export default async function CatedraticosPage() {
  const docentes = await db.select().from(docente).orderBy(asc(docente.nombre));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Catedráticos</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Cada clase se asocia a un catedrático. Acá los das de alta y los editás.
        </p>
      </div>

      <FormularioNuevoCatedratico />

      <div className="flex flex-col">
        {docentes.length === 0 && (
          <p className="text-sm text-neutral-500">Todavía no hay catedráticos cargados.</p>
        )}
        {docentes.map((d) => (
          <FilaCatedratico key={d.id} id={d.id} nombre={d.nombre} email={d.email} />
        ))}
      </div>
    </div>
  );
}
