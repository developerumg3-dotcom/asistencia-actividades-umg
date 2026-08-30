"use client";

import { useActionState, useState } from "react";
import {
  actualizarActividad,
  crearActividad,
  type EstadoFormulario,
} from "@/app/(protegido)/(con-perfil)/admin/actividades/acciones";
import { Boton } from "@/componentes/ui/boton";
import { Campo } from "@/componentes/ui/campo";
import { MensajeFormulario } from "@/componentes/ui/mensaje-formulario";

const estadoInicial: EstadoFormulario = { error: null };

export type ActividadEditable = {
  id: string;
  codigoCorto: string;
  nombre: string;
  descripcion: string | null;
  lugar: string | null;
  tipo: "global" | "extra";
  puntos: number;
  estado: "borrador" | "publicada" | "cerrada";
  ventanaSeg: number;
  iniciaEn: string;
  terminaEn: string;
  marcajeAbreEn: string;
  marcajeCierraEn: string;
};

/** Un bloque del formulario, con su titulo y su explicacion. */
function Seccion({
  titulo,
  ayuda,
  children,
}: {
  titulo: string;
  ayuda?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-3 border-t border-neutral-200 pt-4 first:border-t-0 first:pt-0">
      <legend className="sr-only">{titulo}</legend>
      <div>
        <h3 className="text-sm font-semibold text-neutral-900">{titulo}</h3>
        {ayuda && <p className="text-xs text-neutral-500">{ayuda}</p>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function CamposActividad({ valores }: { valores?: ActividadEditable }) {
  const sufijo = valores?.id ?? "nuevo";
  // El tipo decide los puntos por defecto: las globales valen 1 y la extra 2 (decision 9).
  const [tipo, setTipo] = useState(valores?.tipo ?? "global");

  return (
    <div className="flex flex-col gap-5">
      <Seccion titulo="Qué es">
        <Campo
          id={`nombre-${sufijo}`}
          name="nombre"
          etiqueta="Nombre"
          required
          defaultValue={valores?.nombre ?? ""}
          className="sm:col-span-2"
        />
        <Campo
          id={`lugar-${sufijo}`}
          name="lugar"
          etiqueta="Lugar"
          defaultValue={valores?.lugar ?? ""}
          placeholder="Salón 201"
        />
        <Campo
          id={`descripcion-${sufijo}`}
          name="descripcion"
          etiqueta="Descripción"
          defaultValue={valores?.descripcion ?? ""}
        />
      </Seccion>

      <Seccion
        titulo="Cuánto vale"
        ayuda="Las globales acreditan el punto en todas las clases del alumno. La extra le da saldo que él reparte."
      >
        <Campo
          id={`tipo-${sufijo}`}
          name="tipo"
          etiqueta="Tipo"
          as="select"
          value={tipo}
          onChange={(evento) => setTipo(evento.target.value as "global" | "extra")}
        >
          <option value="global">Global</option>
          <option value="extra">Extra</option>
        </Campo>
        <Campo
          id={`puntos-${sufijo}`}
          name="puntos"
          etiqueta="Puntos"
          type="number"
          min={1}
          required
          key={`puntos-${tipo}-${sufijo}`}
          defaultValue={valores?.puntos ?? (tipo === "extra" ? 2 : 1)}
        />
      </Seccion>

      <Seccion titulo="Cuándo ocurre" ayuda="Horas de Guatemala.">
        <Campo
          id={`iniciaEn-${sufijo}`}
          name="iniciaEn"
          etiqueta="Empieza"
          type="datetime-local"
          required
          defaultValue={valores?.iniciaEn ?? ""}
        />
        <Campo
          id={`terminaEn-${sufijo}`}
          name="terminaEn"
          etiqueta="Termina"
          type="datetime-local"
          required
          defaultValue={valores?.terminaEn ?? ""}
        />
      </Seccion>

      <Seccion
        titulo="Cuándo se puede marcar"
        ayuda="Fuera de esta ventana el QR no acredita, aunque el código sea el vigente."
      >
        <Campo
          id={`marcajeAbreEn-${sufijo}`}
          name="marcajeAbreEn"
          etiqueta="Abre"
          type="datetime-local"
          required
          defaultValue={valores?.marcajeAbreEn ?? ""}
        />
        <Campo
          id={`marcajeCierraEn-${sufijo}`}
          name="marcajeCierraEn"
          etiqueta="Cierra"
          type="datetime-local"
          required
          defaultValue={valores?.marcajeCierraEn ?? ""}
          ayuda="Por defecto, 24 h después del inicio."
        />
        <Campo
          id={`ventanaSeg-${sufijo}`}
          name="ventanaSeg"
          etiqueta="El código cambia cada"
          type="number"
          min={15}
          max={600}
          required
          defaultValue={valores?.ventanaSeg ?? 60}
          ayuda="Segundos. 60 es lo probado."
        />
        <Campo
          id={`estado-${sufijo}`}
          name="estado"
          etiqueta="Estado"
          as="select"
          defaultValue={valores?.estado ?? "borrador"}
          ayuda="Solo las publicadas aceptan marcaje."
        >
          <option value="borrador">Borrador</option>
          <option value="publicada">Publicada</option>
          <option value="cerrada">Cerrada</option>
        </Campo>
      </Seccion>
    </div>
  );
}

function Avisos({ estado }: { estado: EstadoFormulario }) {
  return (
    <>
      {estado.error && <MensajeFormulario tipo="error">{estado.error}</MensajeFormulario>}
      {estado.mensaje && <MensajeFormulario tipo="exito">{estado.mensaje}</MensajeFormulario>}
    </>
  );
}

export function FormularioNuevaActividad() {
  const [estado, accion, enviando] = useActionState(crearActividad, estadoInicial);
  // El formulario arranca cerrado: lo primero que tiene que verse es la lista de
  // actividades, no once campos vacios.
  const [abierto, setAbierto] = useState(false);

  if (!abierto) {
    return (
      <div className="flex justify-end">
        <Boton onClick={() => setAbierto(true)}>Nueva actividad</Boton>
      </div>
    );
  }

  return (
    <form
      action={accion}
      className="flex w-full flex-col gap-5 rounded-md border border-neutral-200 bg-white p-4"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-medium text-neutral-900">Nueva actividad</h2>
        <Boton variante="enlace" type="button" onClick={() => setAbierto(false)}>
          Cancelar
        </Boton>
      </div>
      <CamposActividad />
      <Avisos estado={estado} />
      <div>
        <Boton type="submit" disabled={enviando}>
          {enviando ? "Creando…" : "Crear actividad"}
        </Boton>
      </div>
    </form>
  );
}

export function FormularioEditarActividad({ actividad }: { actividad: ActividadEditable }) {
  const [estado, accion, enviando] = useActionState(actualizarActividad, estadoInicial);
  const [abierto, setAbierto] = useState(false);

  if (!abierto) {
    return (
      <Boton variante="secundario" onClick={() => setAbierto(true)}>
        Editar
      </Boton>
    );
  }

  return (
    <form action={accion} className="flex w-full flex-col gap-5 border-t border-neutral-200 pt-4">
      <input type="hidden" name="id" value={actividad.id} />
      <CamposActividad valores={actividad} />
      <Avisos estado={estado} />
      <div className="flex items-center gap-3">
        <Boton type="submit" disabled={enviando}>
          {enviando ? "Guardando…" : "Guardar cambios"}
        </Boton>
        <Boton variante="enlace" type="button" onClick={() => setAbierto(false)}>
          Cerrar
        </Boton>
      </div>
    </form>
  );
}
