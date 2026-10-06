"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { activarAvisos, apagarAvisos } from "@/lib/push/acciones";
import { Boton } from "@/componentes/ui/boton";
import { Icono } from "@/componentes/ui/icono";
import { MensajeFormulario } from "@/componentes/ui/mensaje-formulario";

/**
 * A5 — "Avisarme de las actividades". Pide el permiso de notificaciones **explicandolo
 * antes**, nunca al cargar la pagina.
 *
 * Esa es la regla central de docs/plan-notificaciones-push.md y no es estetica: si el alumno
 * toca "Bloquear", el navegador recuerda esa decision para siempre y **no se le puede volver
 * a preguntar nunca**. Queda inalcanzable. Un dialogo que aparece solo, sin contexto, se
 * bloquea por reflejo; por eso primero se explica que va a recibir y el permiso se pide recien
 * cuando pulsa el boton.
 */

/** Estado en el que esta este navegador. Se calcula en el cliente, nunca en el render inicial. */
type Situacion =
  | "cargando"
  | "ios_sin_instalar"
  | "sin_soporte"
  | "sin_claves"
  | "disponible"
  | "activado"
  | "bloqueado";

/**
 * `applicationServerKey` quiere bytes, no el texto base64url que imprime
 * `web-push generate-vapid-keys`.
 */
function clavePublicaABytes(base64url: string): Uint8Array<ArrayBuffer> {
  const relleno = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + relleno).replace(/-/g, "+").replace(/_/g, "/");
  const crudo = atob(base64);
  // El buffer se declara `ArrayBuffer` explicito: `applicationServerKey` no acepta un
  // `Uint8Array` que podria estar sobre un `SharedArrayBuffer`.
  const bytes = new Uint8Array(new ArrayBuffer(crudo.length));
  for (let i = 0; i < crudo.length; i++) bytes[i] = crudo.charCodeAt(i);
  return bytes;
}

/**
 * iPhone y iPad corriendo en Safari, sin la app agregada a la pantalla de inicio.
 *
 * Apple solo expone la Web Push API a las PWA instaladas: navegando normal, `PushManager` no
 * existe y no hay forma de pedir el permiso. Detectarlo aparte importa porque el mensaje
 * correcto no es "tu navegador no sirve" —sirve, falta un paso— sino el enlace a la guia de
 * instalacion. Ver docs/plan-notificaciones-push.md, "El problema del iPhone".
 *
 * El iPad con iPadOS 13 o mas se anuncia como Mac, asi que ademas se mira si la pantalla
 * reporta tactil: un Mac de verdad no lo hace.
 */
function esIosSinInstalar(): boolean {
  const ua = navigator.userAgent;
  const esIpadModerno = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  if (!/iPhone|iPad|iPod/.test(ua) && !esIpadModerno) return false;

  const instalada =
    window.matchMedia("(display-mode: standalone)").matches ||
    // Propiedad vieja, solo de Safari, y la unica confiable en iOS.
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return !instalada;
}

function tieneSoporte(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function ActivarAvisos({ clavePublica }: { clavePublica: string | null }) {
  const [situacion, setSituacion] = useState<Situacion>("cargando");
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // El estado real solo se conoce en el navegador: calcularlo en el servidor daria siempre
  // "sin soporte" y despues saltaria como error de hidratacion al corregirse.
  useEffect(() => {
    let cancelado = false;

    (async () => {
      if (esIosSinInstalar()) return setSituacion("ios_sin_instalar");
      if (!tieneSoporte()) return setSituacion("sin_soporte");
      if (!clavePublica) return setSituacion("sin_claves");
      if (Notification.permission === "denied") return setSituacion("bloqueado");

      // Ya concedido no implica suscrito: el alumno pudo limpiar los datos del sitio, o
      // haberse suscrito en otro dispositivo. Se pregunta al service worker.
      const registro = await navigator.serviceWorker.ready;
      const existente = await registro.pushManager.getSubscription();
      if (cancelado) return;
      setSituacion(existente ? "activado" : "disponible");
    })().catch(() => {
      if (!cancelado) setSituacion("sin_soporte");
    });

    return () => {
      cancelado = true;
    };
  }, [clavePublica]);

  async function activar() {
    if (!clavePublica) return;
    setError(null);
    setTrabajando(true);

    try {
      // Este es el unico momento en que se pide el permiso: despues de que el alumno leyo
      // para que sirve y pulso el boton.
      const permiso = await Notification.requestPermission();
      if (permiso === "denied") {
        setSituacion("bloqueado");
        return;
      }
      // "default" significa que cerro el dialogo sin elegir. No es un error y no quema el
      // permiso: se puede volver a intentar.
      if (permiso !== "granted") return;

      const registro = await navigator.serviceWorker.ready;
      const suscripcion =
        (await registro.pushManager.getSubscription()) ??
        (await registro.pushManager.subscribe({
          // Sin esto el navegador aceptaria avisos de cualquiera que conozca el endpoint.
          userVisibleOnly: true,
          applicationServerKey: clavePublicaABytes(clavePublica),
        }));

      const json = suscripcion.toJSON();
      const resultado = await activarAvisos({
        endpoint: suscripcion.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
      });

      if (!resultado.ok) {
        // Si el servidor no la guardo, no sirve de nada dejarla viva en el navegador: el
        // alumno creeria que esta avisado y nunca le llegaria nada.
        await suscripcion.unsubscribe().catch(() => {});
        setError(resultado.error);
        return;
      }

      setSituacion("activado");
    } catch (fallo) {
      console.error("[avisos] no se pudo suscribir:", fallo);
      setError("No se pudieron activar los avisos en este dispositivo.");
    } finally {
      setTrabajando(false);
    }
  }

  async function apagar() {
    setError(null);
    setTrabajando(true);

    try {
      const registro = await navigator.serviceWorker.ready;
      const suscripcion = await registro.pushManager.getSubscription();
      if (suscripcion) {
        // Primero la base y despues el navegador: al revés, si falla el borrado en la base
        // queda una direccion viva a la que ya nadie puede darle de baja desde acá.
        const resultado = await apagarAvisos(suscripcion.endpoint);
        if (!resultado.ok) {
          setError(resultado.error);
          return;
        }
        await suscripcion.unsubscribe();
      }
      setSituacion("disponible");
    } catch (fallo) {
      console.error("[avisos] no se pudo apagar:", fallo);
      setError("No se pudieron apagar los avisos. Probá de nuevo.");
    } finally {
      setTrabajando(false);
    }
  }

  // Mientras no se sabe en qué estado está, no se muestra nada: un bloque que aparece y
  // cambia de texto solo es peor que uno que aparece ya resuelto.
  if (situacion === "cargando") return null;

  // Sin claves VAPID en el entorno no hay nada que ofrecer, y no es algo que el alumno pueda
  // resolver. Se calla.
  if (situacion === "sin_claves") return null;

  if (situacion === "ios_sin_instalar") {
    return (
      <Marco>
        <p className="text-[13px] text-neutral-500">
          Para recibir avisos en tu iPhone tenés que agregar la app a la pantalla de inicio.{" "}
          <Link href="/ayuda/instalar-ios" className="font-semibold text-primary-700">
            Te explicamos cómo
          </Link>
          .
        </p>
      </Marco>
    );
  }

  if (situacion === "sin_soporte") {
    return (
      <Marco>
        <p className="text-[13px] text-neutral-500">
          Este navegador no puede mostrar avisos. Las actividades abiertas igual te aparecen acá
          cuando entrás.
        </p>
      </Marco>
    );
  }

  if (situacion === "bloqueado") {
    return (
      <Marco>
        <p className="text-[13px] text-neutral-500">
          Los avisos están bloqueados en este navegador. Para recibirlos, habilitá las
          notificaciones para este sitio desde la configuración del navegador (el candado o el
          ícono al lado de la dirección) y volvé a entrar.
        </p>
      </Marco>
    );
  }

  const activado = situacion === "activado";

  return (
    <Marco
      interruptor={
        <button
          type="button"
          role="switch"
          aria-checked={activado}
          aria-label="Avisarme de las actividades"
          onClick={activado ? apagar : activar}
          disabled={trabajando}
          className={`relative h-[30px] w-[50px] shrink-0 rounded-full transition-colors disabled:opacity-60 ${
            activado ? "bg-primary-600" : "bg-neutral-300"
          }`}
        >
          <span
            className={`absolute top-[3px] size-6 rounded-full bg-white shadow transition-[left] ${
              activado ? "left-[23px]" : "left-[3px]"
            }`}
          />
        </button>
      }
    >
      <p className="text-[13px] text-neutral-500">
        {trabajando
          ? activado
            ? "Apagando…"
            : "Activando…"
          : activado
            ? "Activados en este dispositivo. Te avisamos cuando haya una actividad nueva."
            : "Una notificación cuando haya una actividad nueva o estés por perder puntos extra. Nada más."}
      </p>
      {error && <MensajeFormulario tipo="error">{error}</MensajeFormulario>}
    </Marco>
  );
}

/** La tarjeta de avisos: icono, titulo y, cuando se puede activar, el interruptor. */
function Marco({ children, interruptor }: { children: React.ReactNode; interruptor?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-tarjeta">
      <Icono nombre="campana" className="self-start" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="font-bold leading-snug">Avisarme de las actividades</p>
        {children}
      </div>
      {interruptor}
    </div>
  );
}
