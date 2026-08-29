"use client";

import { useActionState } from "react";
import {
  actualizarClase,
  crearClase,
  type EstadoFormulario,
} from "@/app/(protegido)/(con-perfil)/admin/clases/acciones";

const estadoInicial: EstadoFormulario = { error: null };

type Docente = { id: string; nombre: string };

export function FormularioNuevaClase({ docentes }: { docentes: Docente[] }) {
  const [estado, accion, enviando] = useActionState(crearClase, estadoInicial);

  return (
    <form action={accion} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <CampoTexto nombre="codigo" etiqueta="Código" />
      <CampoTexto nombre="nombre" etiqueta="Nombre" className="col-span-2" />
      <div className="flex flex-col gap-1">
        <label htmlFor="docenteId-nuevo" className="text-sm font-medium">
          Catedrático
        </label>
        <select
          id="docenteId-nuevo"
          name="docenteId"
          required
          className="rounded-md border border-neutral-300 px-3 py-2 text-base"
        >
          <option value="">Elegí uno</option>
          {docentes.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nombre}
            </option>
          ))}
        </select>
      </div>
      <CampoTexto nombre="seccion" etiqueta="Sección" />
      <CampoTexto nombre="jornada" etiqueta="Jornada" />
      <CampoTexto nombre="ciclo" etiqueta="Ciclo" />
      <div className="col-span-full flex items-center gap-3">
        <button
          type="submit"
          disabled={enviando}
          className="rounded-md bg-neutral-900 px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {enviando ? "Agregando…" : "Agregar clase"}
        </button>
        {docentes.length === 0 && (
          <p className="text-sm text-neutral-500">Primero cargá al menos un catedrático.</p>
        )}
      </div>
      {estado.error && <p className="col-span-full text-sm text-red-600">{estado.error}</p>}
    </form>
  );
}

export function FilaClase({
  id,
  codigo,
  nombre,
  seccion,
  jornada,
  ciclo,
  activa,
  docenteId,
  docentes,
}: {
  id: string;
  codigo: string;
  nombre: string;
  seccion: string;
  jornada: string;
  ciclo: string;
  activa: boolean;
  docenteId: string;
  docentes: Docente[];
}) {
  const [estado, accion, enviando] = useActionState(actualizarClase, estadoInicial);

  return (
    <form
      action={accion}
      className="grid grid-cols-2 items-end gap-3 border-t border-neutral-200 py-3 sm:grid-cols-3"
    >
      <input type="hidden" name="id" value={id} />
      <CampoTexto nombre="codigo" etiqueta="Código" valorInicial={codigo} />
      <CampoTexto nombre="nombre" etiqueta="Nombre" valorInicial={nombre} className="col-span-2" />
      <div className="flex flex-col gap-1">
        <label className="text-xs text-neutral-500">Catedrático</label>
        <select
          name="docenteId"
          defaultValue={docenteId}
          required
          className="rounded-md border border-neutral-300 px-3 py-2 text-base"
        >
          {docentes.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nombre}
            </option>
          ))}
        </select>
      </div>
      <CampoTexto nombre="seccion" etiqueta="Sección" valorInicial={seccion} />
      <CampoTexto nombre="jornada" etiqueta="Jornada" valorInicial={jornada} />
      <CampoTexto nombre="ciclo" etiqueta="Ciclo" valorInicial={ciclo} />
      <label className="col-span-full flex items-center gap-2 text-sm">
        <input type="checkbox" name="activa" defaultChecked={activa} />
        Activa
      </label>
      <div className="col-span-full flex items-center gap-3">
        <button
          type="submit"
          disabled={enviando}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium disabled:opacity-50"
        >
          {enviando ? "Guardando…" : "Guardar"}
        </button>
      </div>
      {estado.error && <p className="col-span-full text-sm text-red-600">{estado.error}</p>}
    </form>
  );
}

function CampoTexto({
  nombre,
  etiqueta,
  valorInicial,
  className,
}: {
  nombre: string;
  etiqueta: string;
  valorInicial?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className ?? ""}`}>
      <label htmlFor={`${nombre}-${valorInicial ?? "nuevo"}`} className="text-sm font-medium">
        {etiqueta}
      </label>
      <input
        id={`${nombre}-${valorInicial ?? "nuevo"}`}
        name={nombre}
        required
        defaultValue={valorInicial}
        className="rounded-md border border-neutral-300 px-3 py-2 text-base"
      />
    </div>
  );
}
