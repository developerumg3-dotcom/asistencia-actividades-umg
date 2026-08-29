"use client";

import { useActionState } from "react";
import { completarPerfil, type EstadoFormulario } from "@/app/(protegido)/perfil/completar/acciones";

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
      <div className="flex flex-col gap-1">
        <label htmlFor="carne" className="text-sm font-medium">
          Carné
        </label>
        <input
          id="carne"
          name="carne"
          type="text"
          required
          defaultValue={carneActual ?? ""}
          autoComplete="off"
          className="rounded-md border border-neutral-300 px-3 py-2 text-base"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="nombre" className="text-sm font-medium">
          Nombre completo
        </label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          required
          defaultValue={nombreActual ?? ""}
          autoComplete="name"
          className="rounded-md border border-neutral-300 px-3 py-2 text-base"
        />
      </div>
      {estado.error && <p className="text-sm text-red-600">{estado.error}</p>}
      <button
        type="submit"
        disabled={enviando}
        className="rounded-md bg-neutral-900 px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {enviando ? "Guardando…" : "Guardar y continuar"}
      </button>
    </form>
  );
}
