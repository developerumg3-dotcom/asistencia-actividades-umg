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
import { Tarjeta } from "@/componentes/ui/tarjeta";

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

/** Campos compartidos por el alta y la edicion. */
function CamposActividad({ valores }: { valores?: ActividadEditable }) {
  // El tipo decide los puntos por defecto: las globales valen 1 y la extra 2 (decision 9).
  const [tipo, setTipo] = useState(valores?.tipo ?? "global");

  return (
    <>
      <Campo
        id={`nombre-${valores?.id ?? "nuevo"}`}
        name="nombre"
        etiqueta="Nombre"
        required
        defaultValue={valores?.nombre ?? ""}
        className="sm:col-span-2"
      />
      <Campo
        id={`lugar-${valores?.id ?? "nuevo"}`}
        name="lugar"
        etiqueta="Lugar"
        defaultValue={valores?.lugar ?? ""}
      />
      <Campo
        id={`descripcion-${valores?.id ?? "nuevo"}`}
        name="descripcion"
        etiqueta="Descripción"
        defaultValue={valores?.descripcion ?? ""}
        className="sm:col-span-3"
      />

      <Campo
        id={`tipo-${valores?.id ?? "nuevo"}`}
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
        id={`puntos-${valores?.id ?? "nuevo"}`}
        name="puntos"
        etiqueta="Puntos"
        type="number"
        min={1}
        required
        key={`puntos-${tipo}-${valores?.id ?? "nuevo"}`}
        defaultValue={valores?.puntos ?? (tipo === "extra" ? 2 : 1)}
      />
      <Campo
        id={`estado-${valores?.id ?? "nuevo"}`}
        name="estado"
        etiqueta="Estado"
        as="select"
        defaultValue={valores?.estado ?? "borrador"}
      >
        <option value="borrador">Borrador</option>
        <option value="publicada">Publicada</option>
        <option value="cerrada">Cerrada</option>
      </Campo>

      <Campo
        id={`iniciaEn-${valores?.id ?? "nuevo"}`}
        name="iniciaEn"
        etiqueta="Empieza"
        type="datetime-local"
        required
        defaultValue={valores?.iniciaEn ?? ""}
      />
      <Campo
        id={`terminaEn-${valores?.id ?? "nuevo"}`}
        name="terminaEn"
        etiqueta="Termina"
        type="datetime-local"
        required
        defaultValue={valores?.terminaEn ?? ""}
      />
      <Campo
        id={`ventanaSeg-${valores?.id ?? "nuevo"}`}
        name="ventanaSeg"
        etiqueta="Ventana del código"
        type="number"
        min={15}
        max={600}
        required
        defaultValue={valores?.ventanaSeg ?? 60}
        ayuda="Segundos que dura cada código."
      />

      <Campo
        id={`marcajeAbreEn-${valores?.id ?? "nuevo"}`}
        name="marcajeAbreEn"
        etiqueta="Marcaje abre"
        type="datetime-local"
        required
        defaultValue={valores?.marcajeAbreEn ?? ""}
      />
      <Campo
        id={`marcajeCierraEn-${valores?.id ?? "nuevo"}`}
        name="marcajeCierraEn"
        etiqueta="Marcaje cierra"
        type="datetime-local"
        required
        defaultValue={valores?.marcajeCierraEn ?? ""}
        ayuda="Por defecto, 24 h después del inicio."
      />
    </>
  );
}

export function FormularioNuevaActividad() {
  const [estado, accion, enviando] = useActionState(crearActividad, estadoInicial);

  return (
    <Tarjeta>
      <form action={accion} className="grid gap-3 sm:grid-cols-3">
        <h2 className="text-sm font-semibold text-neutral-900 sm:col-span-3">Nueva actividad</h2>
        <CamposActividad />
        <div className="sm:col-span-3">
          <Boton type="submit" disabled={enviando}>
            {enviando ? "Creando…" : "Crear actividad"}
          </Boton>
        </div>
        {estado.error && (
          <MensajeFormulario tipo="error" className="sm:col-span-3">
            {estado.error}
          </MensajeFormulario>
        )}
        {estado.mensaje && (
          <MensajeFormulario tipo="exito" className="sm:col-span-3">
            {estado.mensaje}
          </MensajeFormulario>
        )}
      </form>
    </Tarjeta>
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
    <form action={accion} className="grid w-full gap-3 sm:grid-cols-3">
      <input type="hidden" name="id" value={actividad.id} />
      <CamposActividad valores={actividad} />
      <div className="flex items-center gap-3 sm:col-span-3">
        <Boton type="submit" disabled={enviando}>
          {enviando ? "Guardando…" : "Guardar"}
        </Boton>
        <Boton variante="enlace" type="button" onClick={() => setAbierto(false)}>
          Cerrar
        </Boton>
      </div>
      {estado.error && (
        <MensajeFormulario tipo="error" className="sm:col-span-3">
          {estado.error}
        </MensajeFormulario>
      )}
      {estado.mensaje && (
        <MensajeFormulario tipo="exito" className="sm:col-span-3">
          {estado.mensaje}
        </MensajeFormulario>
      )}
    </form>
  );
}
