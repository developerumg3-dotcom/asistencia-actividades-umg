"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type OpcionCombobox = {
  id: string;
  etiqueta: string;
  subEtiqueta?: string;
};

/**
 * Selector múltiple estilo "select2": click abre un dropdown con todas las opciones, escribir
 * filtra en vivo, click en una opción la marca y el dropdown sigue abierto para elegir más
 * (asi se puede tipear "programac" y marcar Programacion I, II y III sin que el filtro se
 * resetee entre clicks). Sin límite de selecciones. Los ids elegidos se mandan al form action
 * como inputs ocultos repetidos (`formData.getAll(name)`), igual que el resto de la app usa
 * Server Actions con <form>.
 */
export function ComboboxMultiple({
  id,
  name,
  etiqueta,
  ayuda,
  placeholder,
  opciones,
  defaultSeleccionados = [],
}: {
  id: string;
  name: string;
  etiqueta?: string;
  ayuda?: string;
  placeholder?: string;
  opciones: OpcionCombobox[];
  defaultSeleccionados?: string[];
}) {
  const [consulta, setConsulta] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set(defaultSeleccionados));
  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    function alClickearAfuera(evento: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(evento.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", alClickearAfuera);
    return () => document.removeEventListener("mousedown", alClickearAfuera);
  }, [abierto]);

  const opcionesFiltradas = useMemo(() => {
    const termino = consulta.trim().toLowerCase();
    if (!termino) return opciones;
    return opciones.filter((o) =>
      [o.etiqueta, o.subEtiqueta].filter(Boolean).join(" ").toLowerCase().includes(termino),
    );
  }, [consulta, opciones]);

  const mapaOpciones = useMemo(() => new Map(opciones.map((o) => [o.id, o])), [opciones]);

  function alternar(idOpcion: string) {
    setSeleccionados((previo) => {
      const nuevo = new Set(previo);
      if (nuevo.has(idOpcion)) nuevo.delete(idOpcion);
      else nuevo.add(idOpcion);
      return nuevo;
    });
  }

  return (
    <div className="flex flex-col gap-1">
      {etiqueta && (
        <label htmlFor={id} className="text-sm font-medium text-neutral-900">
          {etiqueta}
        </label>
      )}
      <div ref={contenedorRef} className="relative">
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={abierto}
          autoComplete="off"
          placeholder={placeholder}
          value={consulta}
          onFocus={() => setAbierto(true)}
          onChange={(evento) => {
            setConsulta(evento.target.value);
            setAbierto(true);
          }}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-base text-neutral-900 placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:border-primary-500"
        />
        {abierto && (
          <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-neutral-200 bg-white py-1 shadow-lg">
            {opcionesFiltradas.length === 0 ? (
              <li className="px-3 py-2 text-sm text-neutral-500">No encontramos cursos con ese nombre.</li>
            ) : (
              opcionesFiltradas.map((o) => {
                const marcada = seleccionados.has(o.id);
                return (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => alternar(o.id)}
                      className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-neutral-50 ${
                        marcada ? "bg-primary-50 text-primary-900" : "text-neutral-900"
                      }`}
                    >
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate">{o.etiqueta}</span>
                        {o.subEtiqueta && <span className="text-xs text-neutral-500">{o.subEtiqueta}</span>}
                      </span>
                      {marcada && (
                        <svg
                          viewBox="0 0 16 16"
                          className="h-4 w-4 shrink-0 text-primary-600"
                          fill="none"
                          strokeWidth="2.5"
                        >
                          <path
                            d="M3.5 8.5l3 3 6-6.5"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>

      {seleccionados.size > 0 && (
        <ul className="flex flex-wrap gap-2 pt-1">
          {[...seleccionados].map((idSeleccionado) => {
            const opcion = mapaOpciones.get(idSeleccionado);
            if (!opcion) return null;
            return (
              <li key={idSeleccionado}>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 py-1 pl-3 pr-1.5 text-sm text-primary-900">
                  {opcion.etiqueta}
                  <button
                    type="button"
                    onClick={() => alternar(idSeleccionado)}
                    aria-label={`Quitar ${opcion.etiqueta}`}
                    className="flex h-4 w-4 items-center justify-center rounded-full text-primary-700 hover:bg-primary-100"
                  >
                    ×
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {ayuda && <p className="text-xs text-neutral-500">{ayuda}</p>}

      {[...seleccionados].map((idSeleccionado) => (
        <input key={idSeleccionado} type="hidden" name={name} value={idSeleccionado} />
      ))}
    </div>
  );
}
