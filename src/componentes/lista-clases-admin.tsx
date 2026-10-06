"use client";

import { useMemo, useState } from "react";
import { FilaClase, type ClaseAdmin, type Docente } from "@/componentes/formulario-clase";
import { Chip, FilaDeChips } from "@/componentes/ui/chip";
import { Icono } from "@/componentes/ui/icono";
import { Vacio } from "@/componentes/ui/titular";

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
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Icono nombre="buscar" className="pointer-events-none absolute left-3.5 top-[13px] text-neutral-400" />
        <input
          id="busqueda-clases-admin"
          type="search"
          aria-label="Buscar clase"
          placeholder="Buscar por nombre, código o catedrático"
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
          className="h-12 w-full rounded-[14px] bg-white pl-11 pr-3.5 text-base shadow-tarjeta outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
        />
      </div>

      <FilaDeChips>
        <Chip activo={ciclo === TODOS && !soloSinCatedratico} onClick={() => { setCiclo(TODOS); setSoloSinCatedratico(false); }}>
          Todas
        </Chip>
        {/* El estado que de verdad importa antes de exportar: una clase sin catedratico
            no tiene a quien entregarle su Excel. */}
        <Chip activo={soloSinCatedratico} onClick={() => setSoloSinCatedratico(!soloSinCatedratico)}>
          Sin catedrático ({sinCatedratico})
        </Chip>
        {ciclos.map((c) => (
          <Chip key={c} activo={ciclo === c} onClick={() => setCiclo(ciclo === c ? TODOS : c)}>
            Ciclo {c}
          </Chip>
        ))}
      </FilaDeChips>

      <p className="text-right text-xs tabular-nums text-neutral-500">
        {filtradas.length} de {clases.length} clases
      </p>

      {filtradas.length === 0 ? (
        <Vacio>No encontramos clases con ese criterio.</Vacio>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtradas.map((c) => (
            <FilaClase key={c.id} clase={c} docentes={docentes} />
          ))}
        </div>
      )}
    </div>
  );
}
