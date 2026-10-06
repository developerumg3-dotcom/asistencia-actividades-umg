"use client";

import { useRef, useState, useTransition } from "react";
import { enviarAvisoGeneral, probarAvisoConmigo } from "@/app/(protegido)/(con-perfil)/admin/notificaciones/acciones";
import { Boton } from "@/componentes/ui/boton";
import { Campo } from "@/componentes/ui/campo";
import { Icono } from "@/componentes/ui/icono";
import { MensajeFormulario } from "@/componentes/ui/mensaje-formulario";
import { consultarAlcance, type AlcanceConFrase } from "@/lib/push/acciones";
import {
  LIMITE_MENSAJE,
  LIMITE_TITULO,
  PREFIJO_PRUEBA,
  validarMensajeGeneral,
} from "@/lib/push/mensaje-general";

type Errores = { titulo?: string; mensaje?: string };

/**
 * B11 — formulario del aviso general.
 *
 * Mismo criterio de dos pasos que `BotonAvisarActividad`: "Revisar y enviar" NO manda nada;
 * consulta y muestra a cuantos de cuantos alumnos les llega, y recien entonces aparece
 * "Enviar a los alumnos". Mientras se confirma, el texto queda bloqueado: lo que se confirma
 * es exactamente lo que se manda.
 *
 * Doble envio: el boton se deshabilita mientras corre, hay un cerrojo sintetico (`useRef`)
 * por si dos clics entran antes de que React pinte, y cada confirmacion lleva un `idEnvio`
 * que el servidor reserva una sola vez y que viaja como `tag` de la notificacion.
 */
export function FormularioNotificacion() {
  const [titulo, setTitulo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [alcance, setAlcance] = useState<AlcanceConFrase | null>(null);
  const [errores, setErrores] = useState<Errores>({});
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<string | null>(null);
  const [pendiente, iniciarTransicion] = useTransition();

  // Un id por intento de envio. Se conserva si el envio falla (el reintento es el MISMO
  // aviso) y se renueva solo al terminar bien o al volver a editar.
  const idEnvio = useRef<string | null>(null);
  const cerrojo = useRef(false);

  const confirmando = alcance !== null;
  const validacion = validarMensajeGeneral({ titulo, mensaje });
  const hayTexto = titulo.trim() !== "" || mensaje.trim() !== "";

  function obtenerId(): string {
    if (!idEnvio.current) idEnvio.current = crypto.randomUUID();
    return idEnvio.current;
  }

  /** Corre `tarea` una sola vez a la vez: un segundo clic mientras corre no hace nada. */
  function ejecutar(tarea: () => Promise<void>) {
    if (cerrojo.current) return;
    cerrojo.current = true;
    iniciarTransicion(async () => {
      try {
        await tarea();
      } finally {
        cerrojo.current = false;
      }
    });
  }

  function limpiarMensajes() {
    setError(null);
    setResultado(null);
    setErrores({});
  }

  function revisar() {
    limpiarMensajes();
    if (!validacion.ok) {
      setErrores(validacion.errores);
      return;
    }
    ejecutar(async () => {
      try {
        setAlcance(await consultarAlcance());
      } catch (fallo) {
        console.error("[push] no se pudo consultar el alcance:", fallo);
        setError("No se pudo consultar a cuántos alumnos llegaría. Probá de nuevo.");
      }
    });
  }

  function enviar() {
    if (!validacion.ok) return;
    limpiarMensajes();
    const id = obtenerId();
    ejecutar(async () => {
      const r = await enviarAvisoGeneral({ titulo, mensaje, idEnvio: id });
      // La cifra mostrada ya quedo vieja tras el envio: se cierra en todos los casos.
      setAlcance(null);
      if (r.ok) {
        setResultado(r.mensaje);
        setTitulo("");
        setMensaje("");
        idEnvio.current = null;
      } else {
        setError(r.error);
        if (r.errores) setErrores(r.errores);
      }
    });
  }

  function probar() {
    if (!validacion.ok) {
      limpiarMensajes();
      setErrores(validacion.errores);
      return;
    }
    limpiarMensajes();
    ejecutar(async () => {
      // Un id nuevo por prueba: probar dos veces el mismo texto es legitimo.
      const r = await probarAvisoConmigo({ titulo, mensaje, idEnvio: crypto.randomUUID() });
      if (r.ok) setResultado(r.mensaje);
      else {
        setError(r.error);
        if (r.errores) setErrores(r.errores);
      }
    });
  }

  function volverAEditar() {
    setAlcance(null);
    // Si se cambia el texto, es otro aviso: otro id.
    idEnvio.current = null;
  }

  const vistaTitulo = titulo.trim() || "Título del aviso";
  const vistaMensaje = mensaje.trim() || "El mensaje aparece acá.";

  return (
    <>
      {/* Asi se va a ver: arriba, porque se actualiza mientras se escribe. */}
      <div className="flex items-start gap-2.5 rounded-[18px] bg-neutral-200/70 p-3" aria-live="polite">
        <div className="grid size-[38px] shrink-0 place-items-center rounded-[10px] bg-white" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element -- miniatura decorativa */}
          <img src="/escudo-umg.webp" alt="" className="size-7" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-neutral-500">Actividades UMG · ahora</p>
          <p className="break-words text-sm font-bold text-tinta">{vistaTitulo}</p>
          <p className="whitespace-pre-line break-words text-[13px] text-neutral-600">{vistaMensaje}</p>
        </div>
      </div>

      <form
        className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-tarjeta"
        onSubmit={(e) => {
          e.preventDefault();
          if (!confirmando) revisar();
        }}
        noValidate
      >
        <Campo
          id="titulo"
          name="titulo"
          type="text"
          etiqueta="Título"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          readOnly={confirmando}
          maxLength={LIMITE_TITULO + 40}
          placeholder="Convocatoria"
          autoComplete="off"
          aria-invalid={errores.titulo ? true : undefined}
          ayuda={`${titulo.trim().length} de ${LIMITE_TITULO} caracteres`}
        />
        {errores.titulo && <MensajeFormulario tipo="error">{errores.titulo}</MensajeFormulario>}

        <Campo
          id="mensaje"
          name="mensaje"
          as="textarea"
          rows={3}
          etiqueta="Mensaje"
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          readOnly={confirmando}
          maxLength={LIMITE_MENSAJE + 100}
          placeholder="Se les convoca a todos al salón 3, vengan."
          aria-invalid={errores.mensaje ? true : undefined}
          ayuda={`${mensaje.trim().length} de ${LIMITE_MENSAJE} caracteres · texto plano`}
        />
        {errores.mensaje && <MensajeFormulario tipo="error">{errores.mensaje}</MensajeFormulario>}

        <p className="text-xs text-neutral-500">
          El aviso se ve en la pantalla bloqueada del teléfono: no pongas notas, carnés ni otros datos
          de un alumno. Al tocarlo se abre el inicio de la app.
        </p>

        {confirmando ? (
          <div className="flex flex-col gap-2.5 rounded-xl bg-fondo p-3.5">
            <p className="font-bold leading-snug">{alcance.frase}</p>
            {alcance.suscritos > 0 && alcance.suscritos < alcance.total && (
              <p className="text-xs text-neutral-500">
                A los demás no les llega: no activaron los avisos, o tienen iPhone sin la app instalada.
                El aviso dentro de la app sigue siendo el canal que les llega a todos.
              </p>
            )}
            <div className="grid grid-cols-2 gap-2.5">
              <Boton type="button" variante="secundario" onClick={volverAEditar} disabled={pendiente}>
                Volver a editar
              </Boton>
              <Boton type="button" onClick={enviar} disabled={pendiente || alcance.suscritos === 0}>
                <Icono nombre="enviar" className="size-[18px]" />
                {pendiente ? "Enviando…" : "Enviar"}
              </Boton>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            <Boton type="button" variante="secundario" onClick={probar} disabled={pendiente || !hayTexto}>
              Probarlo conmigo
            </Boton>
            <Boton type="submit" disabled={pendiente || !hayTexto}>
              {pendiente ? "Consultando…" : "Revisar y enviar"}
            </Boton>
          </div>
        )}

        {resultado && <MensajeFormulario tipo="exito">{resultado}</MensajeFormulario>}
        {error && <MensajeFormulario tipo="error">{error}</MensajeFormulario>}

        <p className="text-xs text-neutral-400">
          Cada sistema recorta el texto a su manera: lo más importante va al principio. «Probarlo
          conmigo» lo manda solo a tus dispositivos, con «{PREFIJO_PRUEBA.trim()}» delante del título.
        </p>
      </form>
    </>
  );
}
