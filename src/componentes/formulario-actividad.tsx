"use client";

import { useActionState, useEffect, useState } from "react";
import {
  actualizarActividad,
  crearActividad,
  type EstadoFormulario,
} from "@/app/(protegido)/(con-perfil)/admin/actividades/acciones";
import { Boton } from "@/componentes/ui/boton";
import { BotonAccion } from "@/componentes/ui/boton-accion";
import { Campo } from "@/componentes/ui/campo";
import { Hoja } from "@/componentes/ui/hoja";
import { Icono } from "@/componentes/ui/icono";
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
  lat: string;
  lon: string;
  radioM: string;
  exigeUbicacion: boolean;
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
    <fieldset className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-tarjeta">
      <legend className="sr-only">{titulo}</legend>
      <div>
        <h3 className="text-sm font-bold text-tinta">{titulo}</h3>
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
    <div className="flex flex-col gap-3">
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

      <Seccion
        titulo="Dónde (opcional)"
        ayuda="Si declarás el lugar, se guarda a qué distancia marcó cada alumno. Se declara por actividad: pegá el punto de Google Maps del lugar de esta. Dejalo vacío para no usarlo."
      >
        <Campo
          id={`lat-${sufijo}`}
          name="lat"
          etiqueta="Latitud"
          defaultValue={valores?.lat ?? ""}
          placeholder="14.308601"
          inputMode="decimal"
          // Google Maps copia el par junto: si se pega aca, se reparte solo en los dos
          // campos en vez de obligar a cortarlo a mano.
          onPaste={(evento) => {
            const texto = evento.clipboardData.getData("text").trim();
            const par = texto.match(/^(-?\d+(?:\.\d+)?)\s*[,;]\s*(-?\d+(?:\.\d+)?)$/);
            // Solo si las dos mitades son coordenadas plausibles: "14,3086" es un decimal
            // escrito con coma, no un par.
            if (!par || Math.abs(Number(par[1])) > 90 || Math.abs(Number(par[2])) > 180) return;
            evento.preventDefault();
            const campoLat = evento.currentTarget as HTMLInputElement;
            campoLat.value = par[1];
            const campoLon = document.getElementById(`lon-${sufijo}`) as HTMLInputElement | null;
            if (campoLon) campoLon.value = par[2];
          }}
        />
        <Campo
          id={`lon-${sufijo}`}
          name="lon"
          etiqueta="Longitud"
          defaultValue={valores?.lon ?? ""}
          placeholder="-90.786206"
          inputMode="decimal"
        />
        <Campo
          id={`radioM-${sufijo}`}
          name="radioM"
          etiqueta="Radio en metros"
          type="number"
          min={20}
          max={5000}
          defaultValue={valores?.radioM ?? ""}
          placeholder="200"
          ayuda="Pegá acá el par que copiás de Google Maps: se reparte solo en los dos campos."
        />
        {/* Checkbox a mano: `Campo` no cubre casillas, por norma de docs/diseno-visual.md. */}
        <div className="sm:col-span-2">
          <label className="flex cursor-pointer items-start gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              name="exigeUbicacion"
              defaultChecked={valores?.exigeUbicacion ?? false}
              className="mt-0.5 h-4 w-4 accent-primary-600"
            />
            Rechazar a quien marque fuera de la zona
          </label>
          <p className="mt-1 text-xs text-neutral-500">
            Solo aplica si declarás latitud, longitud y radio. A quien niegue el permiso de
            ubicación, o cuyo teléfono dé una lectura más imprecisa que el radio, no se le
            bloquea: marca igual y queda anotado.
          </p>
        </div>
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
  // El formulario vive en una hoja: lo primero que tiene que verse es la lista de
  // actividades, no quince campos vacios.
  const [abierto, setAbierto] = useState(false);

  // Creada: se cierra sola. La actividad nueva ya aparece en la lista de atras.
  useEffect(() => {
    if (estado.mensaje && !estado.error) setAbierto(false);
  }, [estado]);

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-[max(1rem,calc(50%-17rem))] z-30 flex h-[54px] items-center gap-2 rounded-full bg-primary-600 pl-4 pr-5 font-bold text-white shadow-[0_10px_24px_rgb(28_114_165_/_0.4)] transition active:scale-95"
      >
        <Icono nombre="sumar" />
        Nueva
      </button>
      <Hoja abierta={abierto} alCerrar={() => setAbierto(false)} titulo="Nueva actividad">
        <form action={accion} className="flex flex-col gap-5">
          <CamposActividad />
          <Avisos estado={estado} />
          <Boton type="submit" disabled={enviando} className="w-full">
            {enviando ? "Creando…" : "Crear actividad"}
          </Boton>
        </form>
      </Hoja>
    </>
  );
}

export function FormularioEditarActividad({ actividad }: { actividad: ActividadEditable }) {
  const [estado, accion, enviando] = useActionState(actualizarActividad, estadoInicial);
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <BotonAccion icono="lista" onClick={() => setAbierto(true)}>
        Editar datos
      </BotonAccion>
      <Hoja abierta={abierto} alCerrar={() => setAbierto(false)} titulo="Editar actividad">
        <form action={accion} className="flex flex-col gap-5">
          <input type="hidden" name="id" value={actividad.id} />
          <CamposActividad valores={actividad} />
          <Avisos estado={estado} />
          <Boton type="submit" disabled={enviando} className="w-full">
            {enviando ? "Guardando…" : "Guardar cambios"}
          </Boton>
        </form>
      </Hoja>
    </>
  );
}
