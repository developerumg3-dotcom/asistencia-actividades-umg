"use client";

import { useActionState } from "react";
import { iniciarSesion, type EstadoFormulario } from "@/app/ingreso/acciones";
import { Boton } from "@/componentes/ui/boton";
import { Campo } from "@/componentes/ui/campo";
import { MensajeFormulario } from "@/componentes/ui/mensaje-formulario";

const estadoInicial: EstadoFormulario = { error: null };

export function FormularioIngreso() {
  const [estado, accion, enviando] = useActionState(iniciarSesion, estadoInicial);

  return (
    <form action={accion} className="flex flex-col gap-4">
      <Campo id="email" name="email" type="email" etiqueta="Correo" required autoComplete="email" />
      <Campo
        id="password"
        name="password"
        type="password"
        etiqueta="Contraseña"
        required
        autoComplete="current-password"
      />
      {estado.error && <MensajeFormulario tipo="error">{estado.error}</MensajeFormulario>}
      <Boton type="submit" disabled={enviando}>
        {enviando ? "Ingresando…" : "Ingresar"}
      </Boton>
    </form>
  );
}
