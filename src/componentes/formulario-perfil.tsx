"use client";

import { useActionState, useMemo, useState } from "react";
import { completarPerfil, type EstadoFormulario } from "@/app/(protegido)/perfil/completar/acciones";
import { SelectorCursosPerfil } from "@/componentes/selector-cursos-perfil";
import { Boton } from "@/componentes/ui/boton";
import { Campo } from "@/componentes/ui/campo";
import { CampoCarne } from "@/componentes/ui/campo-carne";
import { MensajeFormulario } from "@/componentes/ui/mensaje-formulario";
import type { ClaseDisponible } from "@/lib/clases";

const estadoInicial: EstadoFormulario = { error: null };

/** Los diez ciclos del pensum: lo que se ofrece si el catalogo todavia esta vacio. */
const CICLOS = Array.from({ length: 10 }, (_, i) => String(i + 1));

export function FormularioPerfil({
  carneActual,
  nombreActual,
  cicloActual,
  cursosDisponibles,
  idsInscritoInicial,
}: {
  carneActual: string | null;
  nombreActual: string | null;
  cicloActual: string | null;
  cursosDisponibles: ClaseDisponible[];
  idsInscritoInicial: string[];
}) {
  const [estado, accion, enviando] = useActionState(completarPerfil, estadoInicial);

  // Solo los ciclos con cursos cargados: elegir uno vacio dejaria la lista de abajo en blanco
  // (en el segundo semestre solo se imparten los pares, PLANIFICACION.md §4).
  const ciclos = useMemo(() => {
    const conCursos = new Set(cursosDisponibles.map((c) => c.ciclo));
    const lista = CICLOS.filter((c) => conCursos.has(c));
    return lista.length > 0 ? lista : CICLOS;
  }, [cursosDisponibles]);

  // Controlados: React 19 reinicia los campos no controlados cuando la accion termina, y un
  // error del servidor (carne repetido) le borraria al alumno lo que ya habia escrito.
  const [nombre, setNombre] = useState(nombreActual ?? "");
  const [ciclo, setCiclo] = useState(cicloActual && ciclos.includes(cicloActual) ? cicloActual : "");
  const [seccion, setSeccion] = useState<string | null>(null);

  const secciones = useMemo(
    () =>
      [...new Set(cursosDisponibles.filter((c) => c.ciclo === ciclo).map((c) => c.seccion))]
        .filter((s): s is string => Boolean(s))
        .sort((a, b) => a.localeCompare(b, "es")),
    [cursosDisponibles, ciclo],
  );
  const pideSeccion = secciones.length > 1;

  return (
    <form action={accion} className="flex flex-col gap-4">
      <CampoCarne id="carne" name="carne" etiqueta="Carné" required defaultValue={carneActual} />
      <Campo
        id="nombre"
        name="nombre"
        etiqueta="Nombre completo"
        required
        value={nombre}
        onChange={(evento) => setNombre(evento.target.value)}
        autoComplete="name"
      />
      <Campo
        id="ciclo"
        name="ciclo"
        etiqueta="Ciclo que cursás"
        as="select"
        required
        value={ciclo}
        onChange={(evento) => {
          setCiclo(evento.target.value);
          setSeccion(null);
        }}
        ayuda="Sirve para mostrarte primero los cursos de tu ciclo. Vas a poder elegir de cualquier otro."
      >
        <option value="" disabled>
          Elegí tu ciclo
        </option>
        {ciclos.map((c) => (
          <option key={c} value={c}>
            Ciclo {c}
          </option>
        ))}
      </Campo>
      {pideSeccion && (
        <div role="group" aria-labelledby="etiqueta-seccion" className="flex flex-col gap-1.5">
          <p id="etiqueta-seccion" className="text-[13px] font-semibold text-tinta">
            Sección
          </p>
          <div className="flex gap-2">
            {secciones.map((s) => {
              const activa = seccion === s;
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={activa}
                  onClick={() => setSeccion(s)}
                  className={`min-h-12 flex-1 rounded-xl border-[1.5px] text-base font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-100 ${
                    activa
                      ? "border-primary-600 bg-primary-600 text-white"
                      : "border-linea bg-white text-neutral-600"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <SelectorCursosPerfil
        id="cursos"
        name="cursos"
        cursos={cursosDisponibles}
        ciclo={ciclo}
        seccion={seccion}
        pideSeccion={pideSeccion}
        defaultSeleccionados={idsInscritoInicial}
      />
      {estado.error && <MensajeFormulario tipo="error">{estado.error}</MensajeFormulario>}
      <Boton type="submit" disabled={enviando} className="w-full">
        {enviando ? "Guardando…" : "Guardar y continuar"}
      </Boton>
    </form>
  );
}
