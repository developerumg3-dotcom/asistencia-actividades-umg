"use client";

import { useActionState } from "react";
import { completarPerfil, type EstadoFormulario } from "@/app/(protegido)/perfil/completar/acciones";
import { Boton } from "@/componentes/ui/boton";
import { Campo } from "@/componentes/ui/campo";
import { MensajeFormulario } from "@/componentes/ui/mensaje-formulario";

const estadoInicial: EstadoFormulario = { error: null };

export function FormularioPerfil({
  carneActual,
  nombreActual,
}: {
  carneActual: string | null;
  nombreActual: string | null;
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
      {estado.error && <MensajeFormulario tipo="error">{estado.error}</MensajeFormulario>}
      <Boton type="submit" disabled={enviando}>
        {enviando ? "Guardando…" : "Guardar y continuar"}
      </Boton>
    </form>
  );
}
