"use client";

import { useMemo, useState, useTransition } from "react";
import { desinscribirse, inscribirse } from "@/app/(protegido)/(con-perfil)/clases/acciones";
import { Campo } from "@/componentes/ui/campo";
import { Chip } from "@/componentes/ui/chip";
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

/**
 * Los nombres del pensum vienen todos en mayusculas y gritan en pantalla. Se pasan a
 * capitalizacion de titulo, con dos excepciones: los numeros romanos (I, II, III) no son
 * palabras y se quedan enteros, y los conectores van en minuscula salvo al inicio, que es
 * como se escribe en espanol ("Introduccion a los Sistemas de Computo").
 */
const ROMANOS = new Set(["I", "II", "III", "IV", "V"]);
const CONECTORES = new Set(["de", "del", "la", "las", "el", "los", "y", "e", "a", "en", "con", "para"]);

function enTitulo(texto: string) {
  let esPrimera = true;
  return texto
    .split(/(\s+)/)
    .map((parte) => {
      if (!parte.trim()) return parte;
      const limpio = parte.replace(/[^\p{L}]/gu, "");
      if (ROMANOS.has(limpio.toUpperCase()) && limpio.length === parte.length) {
        esPrimera = false;
        return parte.toUpperCase();
      }
      const bajo = parte.toLocaleLowerCase("es");
      const deboBajar = !esPrimera && CONECTORES.has(bajo);
      esPrimera = false;
      return deboBajar ? bajo : bajo.charAt(0).toLocaleUpperCase("es") + bajo.slice(1);
    })
    .join("");
}

function Marca({ marcada }: { marcada: boolean }) {
  return (
    <span
      aria-hidden
      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
        marcada ? "border-primary-600 bg-primary-600" : "border-neutral-300 bg-white"
      }`}
    >
      {marcada && (
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-white" fill="none" strokeWidth="2.5">
          <path d="M3.5 8.5l3 3 6-6.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
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

  /** Agrupado por ciclo: una lista de cincuenta necesita puntos de referencia al desplazarse. */
  const grupos = useMemo(() => {
    const porCiclo = new Map<string, ClaseDisponible[]>();
    for (const c of clasesFiltradas) {
      const lista = porCiclo.get(c.ciclo);
      if (lista) lista.push(c);
      else porCiclo.set(c.ciclo, [c]);
    }
    return [...porCiclo.entries()].sort((a, b) => porCicloNumerico(a[0], b[0]));
  }, [clasesFiltradas]);

  const hayFiltro = busqueda.trim() !== "" || ciclo !== TODOS || soloInscritas;

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

  function limpiarFiltros() {
    setBusqueda("");
    setCiclo(TODOS);
    setSoloInscritas(false);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Lo primero que el alumno quiere saber es cuantos cursos lleva elegidos. */}
      <div className="flex items-center justify-between gap-4 rounded-md border border-primary-200 bg-primary-50 px-4 py-3">
        <div>
          <p className="text-2xl font-semibold tabular-nums text-primary-800">{inscritos.size}</p>
          <p className="text-sm text-primary-800">
            {inscritos.size === 1 ? "curso seleccionado" : "cursos seleccionados"}
          </p>
        </div>
        {pendiente && <span className="text-xs text-primary-700">Guardando…</span>}
      </div>

      <div className="flex flex-col gap-3">
        <Campo
          id="busqueda-clases"
          type="search"
          placeholder="Buscar por nombre o código…"
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
        />

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
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
          <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={soloInscritas}
              onChange={(evento) => setSoloInscritas(evento.target.checked)}
              className="h-4 w-4 accent-primary-600"
            />
            Solo las mías
          </label>
          <p className="text-xs tabular-nums text-neutral-500">
            {clasesFiltradas.length} de {clasesDisponibles.length} cursos
          </p>
        </div>
      </div>

      {error && <MensajeFormulario tipo="error">{error}</MensajeFormulario>}

      {grupos.length === 0 ? (
        <div className="rounded-md border border-dashed border-neutral-300 px-4 py-10 text-center">
          <p className="text-sm text-neutral-600">
            {soloInscritas && inscritos.size === 0
              ? "Todavía no elegiste ningún curso."
              : "No encontramos cursos con ese criterio."}
          </p>
          {hayFiltro && (
            <button
              type="button"
              onClick={limpiarFiltros}
              className="mt-2 text-sm text-primary-700 underline hover:text-primary-800"
            >
              Quitar los filtros
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {grupos.map(([numeroCiclo, cursos]) => (
            <section key={numeroCiclo} className="flex flex-col gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Ciclo {numeroCiclo}
              </h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {cursos.map((c) => {
                  const marcada = inscritos.has(c.id);
                  return (
                    <li key={c.id}>
                      <label
                        className={`flex h-full cursor-pointer items-start gap-3 rounded-md border px-3 py-3 transition-colors ${
                          marcada
                            ? "border-primary-600 bg-primary-50"
                            : "border-neutral-200 bg-white hover:border-primary-300 hover:bg-neutral-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={marcada}
                          disabled={pendiente}
                          onChange={(evento) => alternar(c.id, evento.target.checked)}
                          className="sr-only"
                        />
                        <Marca marcada={marcada} />
                        <span className="flex min-w-0 flex-col gap-0.5">
                          <span
                            className={`text-sm font-medium ${marcada ? "text-primary-900" : "text-neutral-900"}`}
                          >
                            {enTitulo(c.nombre)}
                          </span>
                          <span className="flex flex-wrap items-center gap-x-2 text-xs text-neutral-500">
                            <span className="font-mono">{c.codigo}</span>
                            {c.seccion && <span>· Sección {c.seccion}</span>}
                            <span>· {c.jornada}</span>
                          </span>
                          {c.docenteNombre && (
                            <span className="text-xs text-neutral-600">{c.docenteNombre}</span>
                          )}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
