"use client";

import { useMemo, useState } from "react";
import { CasillaCurso } from "@/componentes/ui/casilla-curso";
import { Icono } from "@/componentes/ui/icono";
import { TituloSeccion, Vacio } from "@/componentes/ui/titular";
import { clasesCampo } from "@/componentes/ui/campo";
import type { ClaseDisponible } from "@/lib/clases";
import { enTitulo } from "@/lib/texto";

/** Los ciclos son "1".."10": ordenarlos como texto pondria el 10 entre el 1 y el 2. */
function porCicloNumerico(a: string, b: string) {
  return Number(a) - Number(b) || a.localeCompare(b, "es");
}

/**
 * Los cursos de A3: una lista fija de casillas, no un desplegable. Muestra los del ciclo (y
 * la seccion, si el ciclo tiene varias) que el alumno eligio arriba; eso solo filtra. Al
 * escribir en el buscador se ignoran ciclo y seccion, para quien lleva cursos de otro lado.
 * Los ids elegidos van al form action como inputs ocultos repetidos (`formData.getAll(name)`).
 */
export function SelectorCursosPerfil({
  id,
  name,
  cursos,
  ciclo,
  seccion,
  pideSeccion,
  defaultSeleccionados = [],
}: {
  id: string;
  name: string;
  cursos: ClaseDisponible[];
  /** "" mientras no eligio ciclo. */
  ciclo: string;
  /** null mientras no eligio, o si el ciclo tiene una sola seccion. */
  seccion: string | null;
  /** El ciclo elegido tiene mas de una seccion: sin ella la lista seria el triple de larga. */
  pideSeccion: boolean;
  defaultSeleccionados?: string[];
}) {
  const [busqueda, setBusqueda] = useState("");
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set(defaultSeleccionados));

  const termino = busqueda.trim().toLowerCase();

  /** Grupos a mostrar, cada uno con su titulo (o sin titulo, para la lista del ciclo). */
  const grupos = useMemo(() => {
    const resultado: { titulo: string | null; cursos: ClaseDisponible[] }[] = [];

    if (termino) {
      const porCiclo = new Map<string, ClaseDisponible[]>();
      for (const c of cursos) {
        const texto = [c.codigo, c.nombre, c.docenteNombre].filter(Boolean).join(" ").toLowerCase();
        if (!texto.includes(termino)) continue;
        const lista = porCiclo.get(c.ciclo);
        if (lista) lista.push(c);
        else porCiclo.set(c.ciclo, [c]);
      }
      for (const [numero, lista] of [...porCiclo.entries()].sort((a, b) => porCicloNumerico(a[0], b[0]))) {
        resultado.push({ titulo: `Ciclo ${numero}`, cursos: lista });
      }
      return resultado;
    }

    const delCiclo =
      ciclo && !(pideSeccion && !seccion)
        ? cursos.filter((c) => c.ciclo === ciclo && (!seccion || c.seccion === seccion))
        : [];
    if (delCiclo.length > 0) resultado.push({ titulo: null, cursos: delCiclo });

    // Lo ya elegido no puede desaparecer al cambiar de ciclo o de seccion.
    const visibles = new Set(delCiclo.map((c) => c.id));
    const otros = cursos.filter((c) => seleccionados.has(c.id) && !visibles.has(c.id));
    if (otros.length > 0) resultado.push({ titulo: "Otros que ya elegiste", cursos: otros });

    return resultado;
  }, [termino, cursos, ciclo, seccion, pideSeccion, seleccionados]);

  function alternar(idCurso: string, marcada: boolean) {
    setSeleccionados((previo) => {
      const nuevo = new Set(previo);
      if (marcada) nuevo.add(idCurso);
      else nuevo.delete(idCurso);
      return nuevo;
    });
  }

  /** Que decir cuando la lista principal no tiene nada que mostrar. */
  let mensajeVacio: string | null = null;
  if (termino) {
    if (grupos.length === 0) mensajeVacio = "No encontramos cursos con ese nombre.";
  } else if (!ciclo) mensajeVacio = "Elegí tu ciclo para ver tus cursos.";
  else if (pideSeccion && !seccion) mensajeVacio = "Elegí tu sección para ver tus cursos.";
  else if (!grupos.some((g) => g.titulo === null)) {
    mensajeVacio = "No hay cursos cargados para ese ciclo. Buscá el tuyo por nombre.";
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor={id} className="text-[13px] font-semibold text-tinta">
            Cursos en donde estás
          </label>
          <p className="shrink-0 text-xs font-semibold tabular-nums text-primary-700" aria-live="polite">
            {seleccionados.size === 1 ? "1 elegido" : `${seleccionados.size} elegidos`}
          </p>
        </div>
        <div className="relative">
          <Icono nombre="buscar" className="pointer-events-none absolute left-3.5 top-[13px] text-neutral-400" />
          <input
            id={id}
            type="search"
            placeholder="Buscar en todos los ciclos"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            // Enter en un campo de un <form> lo envia: aca solo se esta buscando.
            onKeyDown={(evento) => {
              if (evento.key === "Enter") evento.preventDefault();
            }}
            className={`${clasesCampo} w-full pl-11`}
          />
        </div>
        <p className="text-xs text-neutral-500">
          Marcá todos los cursos en donde estás. Si llevás alguno de otro ciclo o sección, buscalo por nombre.
        </p>
      </div>

      {mensajeVacio && (
        <Vacio>
          <p>{mensajeVacio}</p>
        </Vacio>
      )}

      {grupos.map((grupo) => (
        <section key={grupo.titulo ?? "ciclo"} className="flex flex-col gap-2">
          {grupo.titulo && <TituloSeccion>{grupo.titulo}</TituloSeccion>}
          <ul className="flex flex-col gap-2">
            {grupo.cursos.map((c) => (
              <li key={c.id}>
                <CasillaCurso
                  variante="borde"
                  titulo={enTitulo(c.nombre)}
                  detalle={[c.codigo, c.seccion && `Sección ${c.seccion}`, !termino && grupo.titulo && `Ciclo ${c.ciclo}`]
                    .filter(Boolean)
                    .join(" · ")}
                  pie={c.docenteNombre}
                  marcada={seleccionados.has(c.id)}
                  alCambiar={(marcada) => alternar(c.id, marcada)}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {[...seleccionados].map((idSeleccionado) => (
        <input key={idSeleccionado} type="hidden" name={name} value={idSeleccionado} />
      ))}
    </div>
  );
}
