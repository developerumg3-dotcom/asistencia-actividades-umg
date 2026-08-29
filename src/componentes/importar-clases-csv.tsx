"use client";

import { useActionState } from "react";
import {
  importarClasesCsv,
  type EstadoFormulario,
} from "@/app/(protegido)/(con-perfil)/admin/clases/acciones";
import { Boton } from "@/componentes/ui/boton";
import { MensajeFormulario } from "@/componentes/ui/mensaje-formulario";
import { Tarjeta } from "@/componentes/ui/tarjeta";

const estadoInicial: EstadoFormulario = { error: null };

export function ImportarClasesCsv() {
  const [estado, accion, enviando] = useActionState(importarClasesCsv, estadoInicial);

  return (
    <Tarjeta className="p-0">
      <form action={accion} className="flex flex-col gap-3 p-4">
        <div>
          <h2 className="text-sm font-semibold">Importar clases por CSV</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Columnas requeridas: codigo, nombre, seccion, jornada, ciclo, docente_nombre,
            docente_email. Si el catedrático no existe, se crea.
          </p>
        </div>
        <input type="file" name="archivo" accept=".csv,text/csv" required className="text-sm" />
        <Boton type="submit" variante="secundario" disabled={enviando} className="self-start">
          {enviando ? "Importando…" : "Importar"}
        </Boton>
        {estado.error && <MensajeFormulario tipo="error">{estado.error}</MensajeFormulario>}
        {estado.mensaje && <MensajeFormulario tipo="exito">{estado.mensaje}</MensajeFormulario>}
      </form>
    </Tarjeta>
  );
}
