"use client";

import { useActionState } from "react";
import {
  actualizarClase,
  crearClase,
  type EstadoFormulario,
} from "@/app/(protegido)/(con-perfil)/admin/clases/acciones";
import { Boton } from "@/componentes/ui/boton";
import { Campo } from "@/componentes/ui/campo";
import { MensajeFormulario } from "@/componentes/ui/mensaje-formulario";

const estadoInicial: EstadoFormulario = { error: null };

type Docente = { id: string; nombre: string };

export function FormularioNuevaClase({ docentes }: { docentes: Docente[] }) {
  const [estado, accion, enviando] = useActionState(crearClase, estadoInicial);

  return (
    <form action={accion} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <Campo id="codigo-nuevo" name="codigo" etiqueta="Código" required />
      <Campo id="nombre-nuevo" name="nombre" etiqueta="Nombre" required className="col-span-2" />
      <Campo id="docenteId-nuevo" name="docenteId" etiqueta="Catedrático" as="select" defaultValue="">
        <option value="">Por asignar</option>
        {docentes.map((d) => (
          <option key={d.id} value={d.id}>
            {d.nombre}
          </option>
        ))}
      </Campo>
      <Campo id="seccion-nuevo" name="seccion" etiqueta="Sección" />
      <Campo id="jornada-nuevo" name="jornada" etiqueta="Jornada" required />
      <Campo id="ciclo-nuevo" name="ciclo" etiqueta="Ciclo" required />
      <div className="col-span-full flex items-center gap-3">
        <Boton type="submit" disabled={enviando}>
          {enviando ? "Agregando…" : "Agregar clase"}
        </Boton>
      </div>
      {estado.error && (
        <MensajeFormulario tipo="error" className="col-span-full">
          {estado.error}
        </MensajeFormulario>
      )}
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
  seccion: string | null;
  jornada: string;
  ciclo: string;
  activa: boolean;
  docenteId: string | null;
  docentes: Docente[];
}) {
  const [estado, accion, enviando] = useActionState(actualizarClase, estadoInicial);

  return (
    <form
      action={accion}
      className="grid grid-cols-2 items-end gap-3 border-t border-neutral-200 py-3 sm:grid-cols-3"
    >
      <input type="hidden" name="id" value={id} />
      <Campo id={`codigo-${id}`} name="codigo" etiqueta="Código" defaultValue={codigo} required />
      <Campo
        id={`nombre-${id}`}
        name="nombre"
        etiqueta="Nombre"
        defaultValue={nombre}
        required
        className="col-span-2"
      />
      <Campo
        id={`docenteId-${id}`}
        name="docenteId"
        etiqueta="Catedrático"
        as="select"
        defaultValue={docenteId ?? ""}
      >
        <option value="">Por asignar</option>
        {docentes.map((d) => (
          <option key={d.id} value={d.id}>
            {d.nombre}
          </option>
        ))}
      </Campo>
      <Campo id={`seccion-${id}`} name="seccion" etiqueta="Sección" defaultValue={seccion ?? ""} />
      <Campo id={`jornada-${id}`} name="jornada" etiqueta="Jornada" defaultValue={jornada} required />
      <Campo id={`ciclo-${id}`} name="ciclo" etiqueta="Ciclo" defaultValue={ciclo} required />
      <label className="col-span-full flex items-center gap-2 text-sm">
        <input type="checkbox" name="activa" defaultChecked={activa} className="h-4 w-4 accent-primary-600" />
        Activa
      </label>
      <div className="col-span-full flex items-center gap-3">
        <Boton type="submit" variante="secundario" disabled={enviando}>
          {enviando ? "Guardando…" : "Guardar"}
        </Boton>
      </div>
      {estado.error && (
        <MensajeFormulario tipo="error" className="col-span-full">
          {estado.error}
        </MensajeFormulario>
      )}
    </form>
  );
}
