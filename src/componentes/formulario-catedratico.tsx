"use client";

import { useActionState } from "react";
import {
  actualizarDocente,
  crearDocente,
  type EstadoFormulario,
} from "@/app/(protegido)/(con-perfil)/admin/catedraticos/acciones";

const estadoInicial: EstadoFormulario = { error: null };

export function FormularioNuevoCatedratico() {
  const [estado, accion, enviando] = useActionState(crearDocente, estadoInicial);

  return (
    <form action={accion} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="nombre-nuevo" className="text-sm font-medium">
          Nombre
        </label>
        <input
          id="nombre-nuevo"
          name="nombre"
          required
          className="rounded-md border border-neutral-300 px-3 py-2 text-base"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="email-nuevo" className="text-sm font-medium">
          Correo
        </label>
        <input
          id="email-nuevo"
          name="email"
          type="email"
          required
          className="rounded-md border border-neutral-300 px-3 py-2 text-base"
        />
      </div>
      <button
        type="submit"
        disabled={enviando}
        className="rounded-md bg-neutral-900 px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {enviando ? "Agregando…" : "Agregar catedrático"}
      </button>
      {estado.error && <p className="w-full text-sm text-red-600">{estado.error}</p>}
    </form>
  );
}

export function FilaCatedratico({ id, nombre, email }: { id: string; nombre: string; email: string }) {
  const [estado, accion, enviando] = useActionState(actualizarDocente, estadoInicial);

  return (
    <form action={accion} className="flex flex-wrap items-end gap-3 border-t border-neutral-200 py-3">
      <input type="hidden" name="id" value={id} />
      <div className="flex flex-col gap-1">
        <label className="text-xs text-neutral-500">Nombre</label>
        <input
          name="nombre"
          defaultValue={nombre}
          required
          className="rounded-md border border-neutral-300 px-3 py-2 text-base"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-neutral-500">Correo</label>
        <input
          name="email"
          type="email"
          defaultValue={email}
          required
          className="rounded-md border border-neutral-300 px-3 py-2 text-base"
        />
      </div>
      <button
        type="submit"
        disabled={enviando}
        className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium disabled:opacity-50"
      >
        {enviando ? "Guardando…" : "Guardar"}
      </button>
      {estado.error && <p className="w-full text-sm text-red-600">{estado.error}</p>}
    </form>
  );
}
