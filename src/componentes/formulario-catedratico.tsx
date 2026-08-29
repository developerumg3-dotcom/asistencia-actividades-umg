"use client";

import { useActionState } from "react";
import {
  actualizarDocente,
  crearDocente,
  type EstadoFormulario,
} from "@/app/(protegido)/(con-perfil)/admin/catedraticos/acciones";
import { Boton } from "@/componentes/ui/boton";
import { Campo } from "@/componentes/ui/campo";
import { MensajeFormulario } from "@/componentes/ui/mensaje-formulario";

const estadoInicial: EstadoFormulario = { error: null };

export function FormularioNuevoCatedratico() {
  const [estado, accion, enviando] = useActionState(crearDocente, estadoInicial);

  return (
    <form action={accion} className="flex flex-wrap items-end gap-3">
      <Campo id="nombre-nuevo" name="nombre" etiqueta="Nombre" required />
      <Campo id="email-nuevo" name="email" type="email" etiqueta="Correo" required />
      <Boton type="submit" disabled={enviando}>
        {enviando ? "Agregando…" : "Agregar catedrático"}
      </Boton>
      {estado.error && (
        <MensajeFormulario tipo="error" className="w-full">
          {estado.error}
        </MensajeFormulario>
      )}
    </form>
  );
}

export function FilaCatedratico({ id, nombre, email }: { id: string; nombre: string; email: string }) {
  const [estado, accion, enviando] = useActionState(actualizarDocente, estadoInicial);

  return (
    <form action={accion} className="flex flex-wrap items-end gap-3 border-t border-neutral-200 py-3">
      <input type="hidden" name="id" value={id} />
      <Campo id={`nombre-${id}`} name="nombre" etiqueta="Nombre" defaultValue={nombre} required />
      <Campo id={`email-${id}`} name="email" type="email" etiqueta="Correo" defaultValue={email} required />
      <Boton type="submit" variante="secundario" disabled={enviando}>
        {enviando ? "Guardando…" : "Guardar"}
      </Boton>
      {estado.error && (
        <MensajeFormulario tipo="error" className="w-full">
          {estado.error}
        </MensajeFormulario>
      )}
    </form>
  );
}
