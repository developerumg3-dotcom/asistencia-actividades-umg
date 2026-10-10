"use client";

import { useActionState, useState } from "react";
import {
  importarClasesCsv,
  type EstadoFormulario,
} from "@/app/(protegido)/(con-perfil)/admin/clases/acciones";
import { Boton } from "@/componentes/ui/boton";
import { MensajeFormulario } from "@/componentes/ui/mensaje-formulario";

const estadoInicial: EstadoFormulario = { error: null };

export function ImportarClasesCsv() {
  const [estado, accion, enviando] = useActionState(importarClasesCsv, estadoInicial);
  // Se usa una vez cada tanto: no tiene por que ocupar sitio de forma permanente.
  const [abierto, setAbierto] = useState(false);

  if (!abierto) {
    return (
      <Boton variante="secundario" tamano="chico" onClick={() => setAbierto(true)}>
        Importar por CSV
      </Boton>
    );
  }

  return (
    <form
      action={accion}
      className="flex w-full flex-col gap-4 rounded-2xl bg-white shadow-tarjeta p-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-bold text-tinta">Importar clases por CSV</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Columnas requeridas:{" "}
            <code className="font-mono">codigo, nombre, seccion, jornada, ciclo</code>.
            Opcionales: <code className="font-mono">docente_nombre, docente_email</code> — si
            todavía no hay catedrático, dejalas vacías: la sección se crea igual y los alumnos se
            pueden inscribir y marcar. Si el catedrático no existe, se crea. Al terminar te dice
            qué filas se omitieron y por qué.
            <br />
            Podés volver a cargar el mismo archivo sin duplicar nada: las secciones que ya existen
            (mismo código, sección y jornada) se saltan. Cuando llegue el listado de profesores,
            cargalo con los catedráticos llenos y se asignan a las secciones que no tenían.
          </p>
        </div>
        <Boton variante="enlace" type="button" onClick={() => setAbierto(false)}>
          Cancelar
        </Boton>
      </div>
      <input
        type="file"
        name="archivo"
        accept=".csv,text/csv"
        required
        className="text-sm file:mr-3 file:rounded-lg file:border file:border-neutral-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-tinta hover:file:bg-neutral-50"
      />
      {estado.error && <MensajeFormulario tipo="error">{estado.error}</MensajeFormulario>}
      {estado.mensaje && <MensajeFormulario tipo="exito">{estado.mensaje}</MensajeFormulario>}
      <div>
        <Boton type="submit" disabled={enviando}>
          {enviando ? "Importando…" : "Importar"}
        </Boton>
      </div>
    </form>
  );
}
