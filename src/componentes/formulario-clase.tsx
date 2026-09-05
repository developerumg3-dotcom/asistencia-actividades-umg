"use client";

import { useActionState, useState } from "react";
import {
  actualizarClase,
  crearClase,
  duplicarClase,
  type EstadoFormulario,
} from "@/app/(protegido)/(con-perfil)/admin/clases/acciones";
import { Boton } from "@/componentes/ui/boton";
import { Campo } from "@/componentes/ui/campo";
import { MensajeFormulario } from "@/componentes/ui/mensaje-formulario";
import { enTitulo } from "@/lib/texto";

const estadoInicial: EstadoFormulario = { error: null };

export type Docente = { id: string; nombre: string };

export type ClaseAdmin = {
  id: string;
  codigo: string;
  nombre: string;
  seccion: string | null;
  jornada: string;
  ciclo: string;
  activa: boolean;
  docenteId: string | null;
  docenteNombre: string | null;
};

/** Campos compartidos por el alta y la edicion. */
function CamposClase({ valores, docentes }: { valores?: ClaseAdmin; docentes: Docente[] }) {
  const sufijo = valores?.id ?? "nuevo";

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Campo id={`codigo-${sufijo}`} name="codigo" etiqueta="Código" defaultValue={valores?.codigo ?? ""} required />
      <Campo
        id={`nombre-${sufijo}`}
        name="nombre"
        etiqueta="Nombre"
        defaultValue={valores?.nombre ?? ""}
        required
      />
      <Campo
        id={`docenteId-${sufijo}`}
        name="docenteId"
        etiqueta="Catedrático"
        as="select"
        defaultValue={valores?.docenteId ?? ""}
        ayuda="Hace falta antes de exportar el Excel de esta clase."
      >
        <option value="">Por asignar</option>
        {docentes.map((d) => (
          <option key={d.id} value={d.id}>
            {d.nombre}
          </option>
        ))}
      </Campo>
      <Campo
        id={`seccion-${sufijo}`}
        name="seccion"
        etiqueta="Sección"
        defaultValue={valores?.seccion ?? ""}
        placeholder="A"
      />
      <Campo
        id={`jornada-${sufijo}`}
        name="jornada"
        etiqueta="Jornada"
        defaultValue={valores?.jornada ?? "Sábado"}
        required
      />
      <Campo
        id={`ciclo-${sufijo}`}
        name="ciclo"
        etiqueta="Ciclo"
        defaultValue={valores?.ciclo ?? ""}
        required
      />
    </div>
  );
}

export function FormularioNuevaClase({ docentes }: { docentes: Docente[] }) {
  const [estado, accion, enviando] = useActionState(crearClase, estadoInicial);
  const [abierto, setAbierto] = useState(false);

  if (!abierto) {
    return (
      <div className="flex justify-end">
        <Boton onClick={() => setAbierto(true)}>Nueva clase</Boton>
      </div>
    );
  }

  return (
    <form
      action={accion}
      className="flex w-full flex-col gap-4 rounded-md border border-neutral-200 bg-white p-4"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-medium text-neutral-900">Nueva clase</h2>
        <Boton variante="enlace" type="button" onClick={() => setAbierto(false)}>
          Cancelar
        </Boton>
      </div>
      <CamposClase docentes={docentes} />
      {estado.error && <MensajeFormulario tipo="error">{estado.error}</MensajeFormulario>}
      <div>
        <Boton type="submit" disabled={enviando}>
          {enviando ? "Agregando…" : "Agregar clase"}
        </Boton>
      </div>
    </form>
  );
}

export function FilaClase({ clase, docentes }: { clase: ClaseAdmin; docentes: Docente[] }) {
  const [estado, accion, enviando] = useActionState(actualizarClase, estadoInicial);
  const [estadoDuplicar, accionDuplicar, duplicando] = useActionState(duplicarClase, estadoInicial);
  const [abierto, setAbierto] = useState(false);

  return (
    <article className="flex flex-col gap-3 rounded-md border border-neutral-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-medium text-neutral-900">
            {enTitulo(clase.nombre)}{" "}
            <span className="font-mono text-sm font-normal text-neutral-500">{clase.codigo}</span>
          </h2>
          <p className="text-sm text-neutral-500">
            Ciclo {clase.ciclo} · {clase.jornada}
            {clase.seccion && <> · Sección {clase.seccion}</>}
            {!clase.activa && <> · inactiva</>}
          </p>
        </div>
        {clase.docenteNombre ? (
          <span className="shrink-0 rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs font-medium text-neutral-600">
            {clase.docenteNombre}
          </span>
        ) : (
          <span className="shrink-0 rounded-full border border-accent-300 bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-800">
            Sin catedrático
          </span>
        )}
      </div>

      {abierto ? (
        <form action={accion} className="flex flex-col gap-4 border-t border-neutral-200 pt-4">
          <input type="hidden" name="id" value={clase.id} />
          <CamposClase valores={clase} docentes={docentes} />
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              name="activa"
              defaultChecked={clase.activa}
              className="h-4 w-4 accent-primary-600"
            />
            Activa — los alumnos pueden inscribirse
          </label>
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
      ) : (
        <div className="flex flex-col items-end gap-2">
          {estadoDuplicar.error && <MensajeFormulario tipo="error">{estadoDuplicar.error}</MensajeFormulario>}
          {estadoDuplicar.mensaje && <MensajeFormulario tipo="exito">{estadoDuplicar.mensaje}</MensajeFormulario>}
          <div className="flex justify-end gap-3">
            <form action={accionDuplicar}>
              <input type="hidden" name="id" value={clase.id} />
              <Boton
                variante="enlace"
                type="submit"
                disabled={duplicando}
                title="Crea una copia de esta clase como fila nueva, útil para agregar otra sección del mismo curso."
              >
                {duplicando ? "Duplicando…" : "Duplicar"}
              </Boton>
            </form>
            <Boton variante="secundario" onClick={() => setAbierto(true)}>
              Editar
            </Boton>
          </div>
        </div>
      )}
    </article>
  );
}
