"use client";

import { useActionState } from "react";
import { registrarse, type EstadoFormulario } from "@/app/registro/acciones";

const estadoInicial: EstadoFormulario = { error: null };

export function FormularioRegistro() {
  const [estado, accion, enviando] = useActionState(registrarse, estadoInicial);

  return (
    <form action={accion} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          Correo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded-md border border-neutral-300 px-3 py-2 text-base"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="rounded-md border border-neutral-300 px-3 py-2 text-base"
        />
        <p className="text-xs text-neutral-500">Al menos 8 caracteres.</p>
      </div>
      {estado.error && <p className="text-sm text-red-600">{estado.error}</p>}
      <button
        type="submit"
        disabled={enviando}
        className="rounded-md bg-neutral-900 px-4 py-2 font-medium text-white disabled:opacity-50"
      >
        {enviando ? "Creando cuenta…" : "Crear cuenta"}
      </button>
    </form>
  );
}
