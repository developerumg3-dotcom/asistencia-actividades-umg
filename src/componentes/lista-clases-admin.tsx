"use client";

import { useMemo, useState } from "react";
import { FilaClase, type ClaseAdmin, type Docente } from "@/componentes/formulario-clase";
import { Campo } from "@/componentes/ui/campo";
import { Chip } from "@/componentes/ui/chip";

const TODOS = "todos";

/** Los ciclos son "1".."10": ordenarlos como texto pondria el 10 entre el 1 y el 2. */
function porCicloNumerico(a: string, b: string) {
  const na = Number(a);
  const nb = Number(b);
  if (Number.isNaN(na) || Number.isNaN(nb)) return a.localeCompare(b, "es");
  return na - nb;
}

/**
 * El catalogo son cincuenta clases. Sin filtros, la pantalla era cincuenta formularios de
 * edicion apilados y encontrar una era desplazarse a ojo.
 */
export function ListaClasesAdmin({
  clases,
  docentes,
}: {
  clases: ClaseAdmin[];
  docentes: Docente[];
}) {
  const [busqueda, setBusqueda] = useState("");
  const [ciclo, setCiclo] = useState(TODOS);
  const [soloSinCatedratico, setSoloSinCatedratico] = useState(false);

  const ciclos = useMemo(
    () => [...new Set(clases.map((c) => c.ciclo))].sort(porCicloNumerico),
    [clases],
  );

  const filtradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return clases.filter((c) => {
      if (ciclo !== TODOS && c.ciclo !== ciclo) return false;
      if (soloSinCatedratico && c.docenteId) return false;
      if (!termino) return true;
      return [c.codigo, c.nombre, c.seccion, c.jornada, c.docenteNombre]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(termino);
    });
  }, [busqueda, ciclo, soloSinCatedratico, clases]);

  const sinCatedratico = clases.filter((c) => !c.docenteId).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <Campo
          id="busqueda-clases-admin"
          type="search"
          placeholder="Buscar por nombre, código o catedrático…"
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
        />

        <div className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 sm:mx-0 sm:px-0">
          <Chip activo={ciclo === TODOS} onClick={() => setCiclo(TODOS)}>
            Todos
          </Chip>
          {ciclos.map((c) => (
            <Chip key={c} activo={ciclo === c} onClick={() => setCiclo(c)}>
              Ciclo {c}
            </Chip>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          {/* El estado que de verdad importa antes de exportar: una clase sin catedratico
              no tiene a quien entregarle su Excel. */}
          <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={soloSinCatedratico}
              onChange={(evento) => setSoloSinCatedratico(evento.target.checked)}
              className="h-4 w-4 accent-primary-600"
            />
            Solo sin catedrático
            {sinCatedratico > 0 && (
              <span className="rounded-full border border-accent-300 bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-800">
                {sinCatedratico}
              </span>
            )}
          </label>
          <p className="text-xs tabular-nums text-neutral-500">
            {filtradas.length} de {clases.length} clases
          </p>
        </div>
      </div>

      {filtradas.length === 0 ? (
        <div className="rounded-md border border-dashed border-neutral-300 px-4 py-10 text-center">
          <p className="text-sm text-neutral-600">No encontramos clases con ese criterio.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtradas.map((c) => (
            <FilaClase key={c.id} clase={c} docentes={docentes} />
          ))}
        </div>
      )}
    </div>
  );
}
