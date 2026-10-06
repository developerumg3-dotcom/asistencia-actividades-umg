import { and, asc, count, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db/cliente";
import { clase, docente } from "@/db/esquema";
import { FilaCatedratico, FormularioNuevoCatedratico } from "@/componentes/formulario-catedratico";
import { SubBarra, Vacio } from "@/componentes/ui/titular";
import { enTitulo } from "@/lib/texto";

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

  // Los nombres de sus clases, para mostrarlos como pastillas en cada tarjeta.
  const clasesAsignadas = await db
    .select({ docenteId: clase.docenteId, nombre: clase.nombre })
    .from(clase)
    .where(and(isNotNull(clase.docenteId), eq(clase.activa, true)))
    .orderBy(asc(clase.codigo));
  const clasesDe = new Map<string, string[]>();
  for (const c of clasesAsignadas) {
    if (!c.docenteId) continue;
    // Dos secciones del mismo curso son dos clases, pero un solo nombre: se muestra una vez.
    const nombres = clasesDe.get(c.docenteId) ?? [];
    const nombre = enTitulo(c.nombre);
    if (!nombres.includes(nombre)) clasesDe.set(c.docenteId, [...nombres, nombre]);
  }

  const sinClases = docentes.filter((d) => d.clases === 0).length;

  return (
    <>
      <SubBarra titulo="Catedráticos" volverA="/admin/mas">
        <FormularioNuevoCatedratico />
      </SubBarra>
      <p className="text-[13px] text-neutral-500">
        {docentes.length === 0
          ? "Cada clase se asocia a un catedrático, y cada catedrático recibe su Excel."
          : `${docentes.length} ${docentes.length === 1 ? "catedrático" : "catedráticos"}${
              sinClases > 0 ? ` · ${sinClases} sin clases asignadas` : ""
            }. No tienen cuenta: son el nombre que agrupa sus clases en el Excel.`}
      </p>

      {docentes.length === 0 ? (
        <Vacio>
          <p className="font-bold text-tinta">Todavía no hay catedráticos</p>
          <p className="mt-1">Sin catedrático, una clase no se puede exportar a Excel.</p>
        </Vacio>
      ) : (
        <div className="flex flex-col gap-2.5">
          {docentes.map((d) => (
            <FilaCatedratico
              key={d.id}
              id={d.id}
              nombre={d.nombre}
              email={d.email}
              clases={d.clases}
              nombresDeClases={clasesDe.get(d.id) ?? []}
            />
          ))}
        </div>
      )}
    </>
  );
}
