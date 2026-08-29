"use client";

import { useActionState } from "react";
import { registrarse, type EstadoFormulario } from "@/app/registro/acciones";
import { Boton } from "@/componentes/ui/boton";
import { Campo } from "@/componentes/ui/campo";
import { MensajeFormulario } from "@/componentes/ui/mensaje-formulario";

const estadoInicial: EstadoFormulario = { error: null };

export function FormularioRegistro() {
  const [estado, accion, enviando] = useActionState(registrarse, estadoInicial);

  return (
    <form action={accion} className="flex flex-col gap-4">
      <Campo id="email" name="email" type="email" etiqueta="Correo" required autoComplete="email" />
      <Campo
        id="password"
        name="password"
        type="password"
        etiqueta="Contraseña"
        required
        minLength={8}
        autoComplete="new-password"
        ayuda="Al menos 8 caracteres."
      />
      {estado.error && <MensajeFormulario tipo="error">{estado.error}</MensajeFormulario>}
      <Boton type="submit" disabled={enviando}>
        {enviando ? "Creando cuenta…" : "Crear cuenta"}
      </Boton>
    </form>
  );
}
