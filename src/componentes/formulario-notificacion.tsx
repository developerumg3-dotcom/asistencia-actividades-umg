"use client";

import { useRef, useState, useTransition } from "react";
import { enviarAvisoGeneral, probarAvisoConmigo } from "@/app/(protegido)/(con-perfil)/admin/notificaciones/acciones";
import { Boton } from "@/componentes/ui/boton";
import { clasesCampo } from "@/componentes/ui/campo";
import { MensajeFormulario } from "@/componentes/ui/mensaje-formulario";
import { Tarjeta } from "@/componentes/ui/tarjeta";
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
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!confirmando) revisar();
        }}
        noValidate
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="titulo" className="text-sm font-medium text-neutral-900">
            Título
          </label>
          <input
            id="titulo"
            name="titulo"
            type="text"
            className={clasesCampo}
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            readOnly={confirmando}
            maxLength={LIMITE_TITULO + 40}
            placeholder="Convocatoria"
            autoComplete="off"
            aria-invalid={errores.titulo ? true : undefined}
          />
          <p className="text-xs text-neutral-500">
            {titulo.trim().length} de {LIMITE_TITULO} caracteres
          </p>
          {errores.titulo && <MensajeFormulario tipo="error">{errores.titulo}</MensajeFormulario>}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="mensaje" className="text-sm font-medium text-neutral-900">
            Mensaje
          </label>
          <textarea
            id="mensaje"
            name="mensaje"
            rows={4}
            className={clasesCampo}
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            readOnly={confirmando}
            maxLength={LIMITE_MENSAJE + 100}
            placeholder="Se les convoca a todos al salón 3, vengan."
            aria-invalid={errores.mensaje ? true : undefined}
          />
          <p className="text-xs text-neutral-500">
            {mensaje.trim().length} de {LIMITE_MENSAJE} caracteres · texto plano
          </p>
          {errores.mensaje && <MensajeFormulario tipo="error">{errores.mensaje}</MensajeFormulario>}
        </div>

        <p className="text-xs text-neutral-500">
          El aviso se ve en la pantalla bloqueada del teléfono: no pongas notas, carnés ni otros
          datos de un alumno. Al tocarlo se abre el inicio de la app.
        </p>

        {confirmando ? (
          <Tarjeta className="flex flex-col gap-3 bg-neutral-50">
            <p className="text-sm font-medium text-neutral-900">{alcance.frase}</p>
            {alcance.suscritos > 0 && alcance.suscritos < alcance.total && (
              <p className="text-xs text-neutral-500">
                A los demás no les llega: no activaron los avisos, o tienen iPhone sin la app
                instalada. El aviso dentro de la app sigue siendo el canal que les llega a todos.
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <Boton type="button" variante="enlace" onClick={volverAEditar} disabled={pendiente}>
                Volver a editar
              </Boton>
              <Boton type="button" onClick={enviar} disabled={pendiente || alcance.suscritos === 0}>
                {pendiente ? "Enviando…" : "Enviar a los alumnos"}
              </Boton>
            </div>
          </Tarjeta>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <Boton type="submit" disabled={pendiente || !hayTexto}>
              {pendiente ? "Consultando…" : "Revisar y enviar"}
            </Boton>
            <Boton type="button" variante="secundario" onClick={probar} disabled={pendiente || !hayTexto}>
              Probarlo conmigo
            </Boton>
          </div>
        )}

        {resultado && <MensajeFormulario tipo="exito">{resultado}</MensajeFormulario>}
        {error && <MensajeFormulario tipo="error">{error}</MensajeFormulario>}
      </form>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-neutral-900">Así se va a ver</h2>
        <Tarjeta className="flex items-start gap-3 bg-neutral-100" aria-live="polite">
          <div
            className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-600 text-sm font-semibold text-white"
            aria-hidden
          >
            R
          </div>
          <div className="min-w-0">
            <p className="text-xs text-neutral-500">Ronda · ahora</p>
            <p className="break-words text-sm font-semibold text-neutral-900">{vistaTitulo}</p>
            <p className="whitespace-pre-line break-words text-sm text-neutral-700">{vistaMensaje}</p>
          </div>
        </Tarjeta>
        <p className="text-xs text-neutral-500">
          Cada sistema recorta el texto a su manera: lo más importante va al principio. «Probarlo
          conmigo» lo manda solo a tus dispositivos, con «{PREFIJO_PRUEBA.trim()}» delante del título.
        </p>
      </div>
    </div>
  );
}
