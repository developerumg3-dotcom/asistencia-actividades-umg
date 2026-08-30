"use client";

import { useActionState, useState } from "react";
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
  const [abierto, setAbierto] = useState(false);

  if (!abierto) {
    return (
      <div className="flex justify-end">
        <Boton onClick={() => setAbierto(true)}>Nuevo catedrático</Boton>
      </div>
    );
  }

  return (
    <form
      action={accion}
      className="flex w-full flex-col gap-4 rounded-md border border-neutral-200 bg-white p-4"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-medium text-neutral-900">Nuevo catedrático</h2>
        <Boton variante="enlace" type="button" onClick={() => setAbierto(false)}>
          Cancelar
        </Boton>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo id="nombre-nuevo" name="nombre" etiqueta="Nombre" required />
        <Campo
          id="email-nuevo"
          name="email"
          type="email"
          etiqueta="Correo (opcional)"
          ayuda="No hace falta para asignar cursos ni para descargar el Excel."
        />
      </div>
      {estado.error && <MensajeFormulario tipo="error">{estado.error}</MensajeFormulario>}
      <div>
        <Boton type="submit" disabled={enviando}>
          {enviando ? "Agregando…" : "Agregar catedrático"}
        </Boton>
      </div>
    </form>
  );
}

export function FilaCatedratico({
  id,
  nombre,
  email,
  clases,
}: {
  id: string;
  nombre: string;
  email: string | null;
  clases: number;
}) {
  const [estado, accion, enviando] = useActionState(actualizarDocente, estadoInicial);
  const [abierto, setAbierto] = useState(false);

  return (
    <article className="flex flex-col gap-4 rounded-md border border-neutral-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-medium text-neutral-900">{nombre}</h2>
          {email && <p className="truncate text-sm text-neutral-600">{email}</p>}
        </div>
        {/* Un catedratico sin clases no recibe Excel: es un dato huerfano y conviene verlo. */}
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${
            clases === 0
              ? "border-accent-300 bg-accent-50 text-accent-800"
              : "border-neutral-200 bg-neutral-50 text-neutral-600"
          }`}
        >
          {clases === 0 ? "Sin clases asignadas" : `${clases} ${clases === 1 ? "clase" : "clases"}`}
        </span>
      </div>

      {abierto && (
        <form action={accion} className="flex flex-col gap-4 border-t border-neutral-200 pt-4">
          <input type="hidden" name="id" value={id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Campo id={`nombre-${id}`} name="nombre" etiqueta="Nombre" defaultValue={nombre} required />
            <Campo
              id={`email-${id}`}
              name="email"
              type="email"
              etiqueta="Correo (opcional)"
              defaultValue={email ?? ""}
            />
          </div>
          {estado.error && <MensajeFormulario tipo="error">{estado.error}</MensajeFormulario>}
          <div className="flex items-center gap-3">
            <Boton type="submit" disabled={enviando}>
              {enviando ? "Guardando…" : "Guardar cambios"}
            </Boton>
            <Boton variante="enlace" type="button" onClick={() => setAbierto(false)}>
              Cerrar
            </Boton>
          </div>
        </form>
      )}

      {!abierto && (
        <div className="flex justify-end">
          <Boton variante="secundario" onClick={() => setAbierto(true)}>
            Editar
          </Boton>
        </div>
      )}
    </article>
  );
}
