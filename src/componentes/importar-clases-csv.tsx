"use client";

import { useActionState } from "react";
import {
  importarClasesCsv,
  type EstadoFormulario,
} from "@/app/(protegido)/(con-perfil)/admin/clases/acciones";

const estadoInicial: EstadoFormulario = { error: null };

export function ImportarClasesCsv() {
  const [estado, accion, enviando] = useActionState(importarClasesCsv, estadoInicial);

  return (
    <form action={accion} className="flex flex-col gap-3 rounded-md border border-neutral-300 p-4">
      <div>
        <h2 className="text-sm font-semibold">Importar clases por CSV</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Columnas requeridas: codigo, nombre, seccion, jornada, ciclo, docente_nombre,
          docente_email. Si el catedrático no existe, se crea.
        </p>
      </div>
      <input type="file" name="archivo" accept=".csv,text/csv" required className="text-sm" />
      <button
        type="submit"
        disabled={enviando}
        className="self-start rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        {enviando ? "Importando…" : "Importar"}
      </button>
      {estado.error && <p className="text-sm text-red-600">{estado.error}</p>}
      {estado.mensaje && <p className="text-sm text-green-700">{estado.mensaje}</p>}
    </form>
  );
}
