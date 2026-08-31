"use client";

import { useMemo, useState, useTransition } from "react";
import {
  agregarInscripcionAdmin,
  quitarInscripcionAdmin,
} from "@/app/(protegido)/(con-perfil)/admin/alumnos/acciones";
import { Campo } from "@/componentes/ui/campo";
import { MensajeFormulario } from "@/componentes/ui/mensaje-formulario";
import type { ClaseDisponible } from "@/lib/clases";
import { enTitulo } from "@/lib/texto";

/**
 * Version admin de `SelectorClases` (B7, Fase 4): corrige las inscripciones de un alumno
 * cualquiera, no las del alumno de la sesion. Mas simple a proposito — sin agrupar por ciclo
 * ni chips — porque acá se llega ya sabiendo a quien se edita, no explorando el catálogo.
 */
export function SelectorClasesAdmin({
  alumnoId,
  clasesDisponibles,
  idsInscritoInicial,
}: {
  alumnoId: string;
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
      [c.codigo, c.nombre, c.seccion, c.jornada, c.docenteNombre].filter(Boolean).join(" ").toLowerCase().includes(termino),
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
        if (marcada) await agregarInscripcionAdmin(alumnoId, claseId);
        else await quitarInscripcionAdmin(alumnoId, claseId);
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
    <div className="flex flex-col gap-3">
      <Campo
        id="busqueda-clases-admin"
        type="search"
        placeholder="Buscar por nombre o código…"
        value={busqueda}
        onChange={(evento) => setBusqueda(evento.target.value)}
      />
      {pendiente && <p className="text-xs text-neutral-500">Guardando…</p>}
      {error && <MensajeFormulario tipo="error">{error}</MensajeFormulario>}

      <ul className="grid max-h-96 gap-2 overflow-y-auto sm:grid-cols-2">
        {clasesFiltradas.map((c) => {
          const marcada = inscritos.has(c.id);
          return (
            <li key={c.id}>
              <label
                className={`flex cursor-pointer items-start gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                  marcada ? "border-primary-600 bg-primary-50" : "border-neutral-200 bg-white hover:bg-neutral-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={marcada}
                  disabled={pendiente}
                  onChange={(evento) => alternar(c.id, evento.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-primary-600"
                />
                <span>
                  <span className="block font-medium text-neutral-900">{enTitulo(c.nombre)}</span>
                  <span className="text-xs text-neutral-500">
                    {c.codigo}
                    {c.seccion && ` · Sección ${c.seccion}`} · {c.jornada}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
