"use client";

import { useMemo, useState, useTransition } from "react";
import { desinscribirse, inscribirse } from "@/app/(protegido)/(con-perfil)/clases/acciones";
import { Campo } from "@/componentes/ui/campo";
import { MensajeFormulario } from "@/componentes/ui/mensaje-formulario";

type ClaseDisponible = {
  id: string;
  codigo: string;
  nombre: string;
  seccion: string;
  jornada: string;
  docenteNombre: string;
};

export function SelectorClases({
  clasesDisponibles,
  idsInscritoInicial,
}: {
  clasesDisponibles: ClaseDisponible[];
  idsInscritoInicial: string[];
}) {
  const [busqueda, setBusqueda] = useState("");
  const [inscritos, setInscritos] = useState<Set<string>>(new Set(idsInscritoInicial));
  const [pendiente, iniciarTransicion] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const clasesFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return clasesDisponibles;
    return clasesDisponibles.filter((c) =>
      [c.codigo, c.nombre, c.seccion, c.jornada, c.docenteNombre].join(" ").toLowerCase().includes(termino),
    );
  }, [busqueda, clasesDisponibles]);

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
        placeholder="Buscar por nombre, código o catedrático…"
        value={busqueda}
        onChange={(evento) => setBusqueda(evento.target.value)}
      />
      {error && <MensajeFormulario tipo="error">{error}</MensajeFormulario>}
      <ul className="flex flex-col divide-y divide-neutral-200">
        {clasesFiltradas.map((c) => {
          const marcada = inscritos.has(c.id);
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
                <p className="text-xs text-neutral-500">
                  {c.docenteNombre} · sección {c.seccion} · {c.jornada}
                </p>
              </div>
            </li>
          );
        })}
        {clasesFiltradas.length === 0 && (
          <li className="py-2 text-sm text-neutral-500">No encontramos clases con ese criterio.</li>
        )}
      </ul>
    </div>
  );
}
