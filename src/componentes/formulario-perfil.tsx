"use client";

import { useActionState } from "react";
import { completarPerfil, type EstadoFormulario } from "@/app/(protegido)/perfil/completar/acciones";
import { Boton } from "@/componentes/ui/boton";
import { Campo } from "@/componentes/ui/campo";
import { MensajeFormulario } from "@/componentes/ui/mensaje-formulario";

const estadoInicial: EstadoFormulario = { error: null };

/** Los diez ciclos del pensum. */
const CICLOS = Array.from({ length: 10 }, (_, i) => String(i + 1));

export function FormularioPerfil({
  carneActual,
  nombreActual,
  cicloActual,
}: {
  carneActual: string | null;
  nombreActual: string | null;
  cicloActual: string | null;
}) {
  const [estado, accion, enviando] = useActionState(completarPerfil, estadoInicial);

  return (
    <form action={accion} className="flex flex-col gap-4">
      <Campo
        id="carne"
        name="carne"
        etiqueta="Carné"
        required
        defaultValue={carneActual ?? ""}
        autoComplete="off"
      />
      <Campo
        id="nombre"
        name="nombre"
        etiqueta="Nombre completo"
        required
        defaultValue={nombreActual ?? ""}
        autoComplete="name"
      />
      <Campo
        id="ciclo"
        name="ciclo"
        etiqueta="Ciclo que cursás"
        as="select"
        required
        defaultValue={cicloActual ?? ""}
        ayuda="Sirve para mostrarte primero los cursos de tu ciclo. Vas a poder elegir de cualquier otro."
      >
        <option value="" disabled>
          Elegí tu ciclo
        </option>
        {CICLOS.map((c) => (
          <option key={c} value={c}>
            Ciclo {c}
          </option>
        ))}
      </Campo>
      {estado.error && <MensajeFormulario tipo="error">{estado.error}</MensajeFormulario>}
      <Boton type="submit" disabled={enviando}>
        {enviando ? "Guardando…" : "Guardar y continuar"}
      </Boton>
    </form>
  );
}
