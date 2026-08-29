"use client";

import { useMemo, useState, useTransition } from "react";
import { desinscribirse, inscribirse } from "@/app/(protegido)/(con-perfil)/clases/acciones";
import { Campo } from "@/componentes/ui/campo";
import { MensajeFormulario } from "@/componentes/ui/mensaje-formulario";

type ClaseDisponible = {
  id: string;
  codigo: string;
  nombre: string;
  seccion: string | null;
  jornada: string;
  ciclo: string;
  docenteNombre: string | null;
};

const TODOS = "todos";

/** Los ciclos son "1".."10": ordenarlos como texto pondria el 10 entre el 1 y el 2. */
function porCicloNumerico(a: string, b: string) {
  const na = Number(a);
  const nb = Number(b);
  if (Number.isNaN(na) || Number.isNaN(nb)) return a.localeCompare(b, "es");
  return na - nb;
}

export function SelectorClases({
  clasesDisponibles,
  idsInscritoInicial,
}: {
  clasesDisponibles: ClaseDisponible[];
  idsInscritoInicial: string[];
}) {
  const [busqueda, setBusqueda] = useState("");
  const [ciclo, setCiclo] = useState(TODOS);
  const [soloInscritas, setSoloInscritas] = useState(false);
  const [inscritos, setInscritos] = useState<Set<string>>(new Set(idsInscritoInicial));
  const [pendiente, iniciarTransicion] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const ciclos = useMemo(
    () => [...new Set(clasesDisponibles.map((c) => c.ciclo))].sort(porCicloNumerico),
    [clasesDisponibles],
  );

  const clasesFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    return clasesDisponibles.filter((c) => {
      if (ciclo !== TODOS && c.ciclo !== ciclo) return false;
      if (soloInscritas && !inscritos.has(c.id)) return false;
      if (!termino) return true;
      return [c.codigo, c.nombre, c.seccion, c.jornada, c.docenteNombre]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(termino);
    });
  }, [busqueda, ciclo, soloInscritas, inscritos, clasesDisponibles]);

  function alternar(claseId: string, marcada: boolean) {
    setError(null);
    setInscritos((previo) => {
      const nuevo = new Set(previo);
      if (marcada) nuevo.add(claseId);
      else nuevo.delete(claseId);
      return nuevo;
    });
    iniciarTransicion(async () => {
      try {
        if (marcada) await inscribirse(claseId);
        else await desinscribirse(claseId);
      } catch {
        setError("No se pudo guardar el cambio. Probá de nuevo.");
        setInscritos((previo) => {
          const nuevo = new Set(previo);
          if (marcada) nuevo.delete(claseId);
          else nuevo.add(claseId);
          return nuevo;
        });
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Campo
        id="busqueda-clases"
        type="search"
        placeholder="Buscar por nombre o código…"
        value={busqueda}
        onChange={(evento) => setBusqueda(evento.target.value)}
      />

      <div className="flex flex-wrap items-end gap-3">
        <Campo
          id="filtro-ciclo"
          as="select"
          etiqueta="Ciclo"
          value={ciclo}
          onChange={(evento) => setCiclo(evento.target.value)}
          className="min-w-32"
        >
          <option value={TODOS}>Todos</option>
          {ciclos.map((c) => (
            <option key={c} value={c}>
              Ciclo {c}
            </option>
          ))}
        </Campo>
        <label className="flex items-center gap-2 py-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={soloInscritas}
            onChange={(evento) => setSoloInscritas(evento.target.checked)}
            className="h-4 w-4 accent-primary-600"
          />
          Solo las mías ({inscritos.size})
        </label>
      </div>

      {error && <MensajeFormulario tipo="error">{error}</MensajeFormulario>}

      <p className="text-xs text-neutral-500">
        {clasesFiltradas.length} de {clasesDisponibles.length} cursos
      </p>

      <ul className="flex flex-col divide-y divide-neutral-200">
        {clasesFiltradas.map((c) => {
          const marcada = inscritos.has(c.id);
          const detalle = [
            `Ciclo ${c.ciclo}`,
            c.seccion ? `sección ${c.seccion}` : null,
            c.jornada,
          ].filter(Boolean);
          return (
            <li key={c.id} className="flex items-center gap-3 py-2">
              <input
                type="checkbox"
                checked={marcada}
                disabled={pendiente}
                onChange={(evento) => alternar(c.id, evento.target.checked)}
                className="h-5 w-5 shrink-0 accent-primary-600"
                aria-label={`Inscribirme en ${c.nombre}`}
              />
              <div>
                <p className="text-sm font-medium">
                  {c.nombre} <span className="text-neutral-500">({c.codigo})</span>
                </p>
                <p className="text-xs text-neutral-500">{detalle.join(" · ")}</p>
                {c.docenteNombre ? (
                  <p className="text-xs text-neutral-500">{c.docenteNombre}</p>
                ) : (
                  <p className="text-xs text-accent-700">Catedrático por asignar</p>
                )}
              </div>
            </li>
          );
        })}
        {clasesFiltradas.length === 0 && (
          <li className="py-2 text-sm text-neutral-500">No encontramos cursos con ese criterio.</li>
        )}
      </ul>
    </div>
  );
}
