"use client";

import { useMemo, useState, useTransition } from "react";
import { desinscribirse, inscribirse } from "@/app/(protegido)/(con-perfil)/(alumno)/clases/acciones";
import { Chip, FilaDeChips } from "@/componentes/ui/chip";
import { Icono } from "@/componentes/ui/icono";
import { TituloSeccion, Vacio } from "@/componentes/ui/titular";
import { MensajeFormulario } from "@/componentes/ui/mensaje-formulario";
import type { ClaseDisponible } from "@/lib/clases";
import { enTitulo } from "@/lib/texto";

const TODOS = "todos";

/** Los ciclos son "1".."10": ordenarlos como texto pondria el 10 entre el 1 y el 2. */
function porCicloNumerico(a: string, b: string) {
  const na = Number(a);
  const nb = Number(b);
  if (Number.isNaN(na) || Number.isNaN(nb)) return a.localeCompare(b, "es");
  return na - nb;
}

function Marca({ marcada }: { marcada: boolean }) {
  return (
    <span
      aria-hidden
      className={`grid size-[26px] shrink-0 place-items-center rounded-[9px] border-2 text-white transition-colors ${
        marcada ? "border-primary-600 bg-primary-600" : "border-neutral-300 bg-white"
      }`}
    >
      {marcada && <Icono nombre="ok" grosor={3} className="size-4" />}
    </span>
  );
}

export function SelectorClases({
  clasesDisponibles,
  idsInscritoInicial,
  cicloAlumno,
}: {
  clasesDisponibles: ClaseDisponible[];
  idsInscritoInicial: string[];
  /** Ciclo declarado en el perfil. Solo decide el filtro inicial; no restringe nada. */
  cicloAlumno: string | null;
}) {
  const [busqueda, setBusqueda] = useState("");
  // Arranca en el ciclo del alumno: ahi estan casi todos sus cursos. Si no lo declaro
  // todavia (cuentas creadas antes de pedirlo), arranca en todos.
  const [ciclo, setCiclo] = useState(cicloAlumno ?? TODOS);
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
        if (marcada) {
          const resultado = await inscribirse(claseId);
          if (resultado.error) {
            setError(resultado.error);
            setInscritos((previo) => {
              const nuevo = new Set(previo);
              nuevo.delete(claseId);
              return nuevo;
            });
          }
        }
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
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Icono nombre="buscar" className="pointer-events-none absolute left-3.5 top-[13px] text-neutral-400" />
        <input
          id="busqueda-clases"
          type="search"
          aria-label="Buscar curso"
          placeholder="Buscar por nombre o código"
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
          className="h-12 w-full rounded-[14px] bg-white pl-11 pr-3.5 text-base shadow-tarjeta outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
        />
      </div>

      <FilaDeChips>
        <Chip activo={soloInscritas} onClick={() => setSoloInscritas(!soloInscritas)}>
          Solo los míos · {inscritos.size}
        </Chip>
        {cicloAlumno && (
          <Chip activo={ciclo === cicloAlumno} onClick={() => setCiclo(cicloAlumno)}>
            Mi ciclo ({cicloAlumno})
          </Chip>
        )}
        <Chip activo={ciclo === TODOS} onClick={() => setCiclo(TODOS)}>
          Todos
        </Chip>
        {ciclos
          .filter((c) => c !== cicloAlumno)
          .map((c) => (
            <Chip key={c} activo={ciclo === c} onClick={() => setCiclo(c)}>
              Ciclo {c}
            </Chip>
          ))}
      </FilaDeChips>

      <div className="flex items-center justify-between gap-3 text-xs text-neutral-500">
        {/* El catalogo completo existe justamente porque hay atrasados y adelantados: si
            arrancamos filtrados en su ciclo, hay que decirle como salir de ahi. */}
        {cicloAlumno && ciclo === cicloAlumno ? (
          <p>
            ¿Llevás cursos de otro ciclo?{" "}
            <button type="button" onClick={() => setCiclo(TODOS)} className="font-semibold text-primary-700">
              Ver todos
            </button>
          </p>
        ) : (
          <span />
        )}
        <p className="shrink-0 tabular-nums">
          {pendiente ? "Guardando…" : `${clasesFiltradas.length} de ${clasesDisponibles.length} cursos`}
        </p>
      </div>

      {error && <MensajeFormulario tipo="error">{error}</MensajeFormulario>}

      {grupos.length === 0 ? (
        <Vacio>
          <p>
            {soloInscritas && inscritos.size === 0
              ? "Todavía no elegiste ningún curso."
              : "No encontramos cursos con ese criterio."}
          </p>
          {hayFiltro && (
            <button type="button" onClick={limpiarFiltros} className="mt-2 font-semibold text-primary-700">
              Quitar los filtros
            </button>
          )}
        </Vacio>
      ) : (
        <div className="flex flex-col gap-4">
          {grupos.map(([numeroCiclo, cursos]) => (
            <section key={numeroCiclo} className="flex flex-col gap-2">
              <TituloSeccion>Ciclo {numeroCiclo}</TituloSeccion>
              <ul className="flex flex-col gap-2.5">
                {cursos.map((c) => {
                  const marcada = inscritos.has(c.id);
                  return (
                    <li key={c.id}>
                      <label
                        className={`flex cursor-pointer items-center gap-3 rounded-2xl bg-white p-3.5 transition-shadow ${
                          marcada ? "shadow-[inset_0_0_0_2px_var(--color-primary-600)]" : "shadow-tarjeta"
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
                        <span className="flex min-w-0 flex-col">
                          <span className="text-[14.5px] font-bold leading-snug">{enTitulo(c.nombre)}</span>
                          <span className="text-xs text-neutral-400">
                            {c.codigo}
                            {c.seccion && ` · Sección ${c.seccion}`} · {c.jornada}
                          </span>
                          {c.docenteNombre && <span className="text-[13px] text-neutral-500">{c.docenteNombre}</span>}
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
