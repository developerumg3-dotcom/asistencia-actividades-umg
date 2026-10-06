"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { marcarAsistencia, type EstadoMarcaje } from "@/app/a/[codigoCorto]/[codigo]/acciones";
import { Boton, clasesDeBoton } from "@/componentes/ui/boton";
import { Icono } from "@/componentes/ui/icono";

const estadoInicialMarcaje: EstadoMarcaje = { resultado: null, mensaje: null };

/**
 * A7 — el resultado, a pantalla completa: verde si el punto quedo, rojo si no. Es lo menos
 * sutil de la app a proposito, para que nadie pueda decir despues "yo escanee y no me dio el
 * punto" sin haber visto una pantalla entera diciendole que paso (docs/diseno-visual.md).
 * Se muestra sin navegar (PLANIFICACION.md §6.4) y con los textos de la §7 tal cual.
 */
function Resultado({
  estado,
  puntos,
  esExtra,
  alReintentar,
}: {
  estado: EstadoMarcaje;
  puntos: number;
  esExtra: boolean;
  alReintentar: () => void;
}) {
  const exito = estado.resultado === "ok";
  const bien = exito || estado.resultado === "duplicado";
  const blanco = clasesDeBoton("secundario", "w-full !bg-white !text-tinta !shadow-none");

  return (
    <div
      role="status"
      aria-live="assertive"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 overflow-y-auto px-6 py-8 text-center text-white ${
        bien
          ? "bg-[radial-gradient(90%_60%_at_50%_30%,#1b8f68,#0a3d2e_75%)]"
          : "bg-[radial-gradient(90%_60%_at_50%_30%,#a53b39,#3d1312_75%)]"
      }`}
    >
      <div
        className={`grid size-32 shrink-0 place-items-center rounded-full bg-white [animation:sello_.55s_cubic-bezier(.2,1.5,.4,1)] ${
          bien ? "text-emerald-700" : "text-danger-700"
        }`}
      >
        <Icono nombre={bien ? "ok" : "x"} grosor={2.8} className="size-[66px]" />
      </div>

      <div className="max-w-sm">
        <h1 className="text-[26px] font-extrabold leading-tight tracking-tight">
          {exito ? "¡Asistencia registrada!" : estado.mensaje}
        </h1>
        {exito && estado.mensaje && <p className="mt-2.5 text-[15px] opacity-90">{estado.mensaje}</p>}
        {estado.resultado === "expirado" && (
          <p className="mt-2.5 text-[15px] opacity-90">
            Volvé a apuntar la cámara al QR de la pantalla. El código cambia cada minuto.
          </p>
        )}
        {estado.resultado === "fuera_de_zona" && (
          <p className="mt-2.5 text-[15px] opacity-90">
            Esta actividad solo acredita en el lugar del evento. Si ya estás ahí, acercate un poco más y
            volvé a pulsar el botón.
          </p>
        )}
      </div>

      {exito && (
        <p className="text-[64px] font-extrabold leading-none tracking-tight tabular-nums">
          +{puntos}
          <span className="mt-2 block text-[13px] font-bold uppercase tracking-wider opacity-85">
            {esExtra ? "a tu saldo de puntos extra" : "en cada una de tus clases"}
          </span>
        </p>
      )}

      <div className="flex w-full max-w-sm flex-col items-center gap-4">
        {bien ? (
          <Link href="/inicio" className={blanco}>
            Ver mis puntos
          </Link>
        ) : estado.resultado === "sin_perfil" ? (
          <Link href="/perfil/completar" className={blanco}>
            Completar mi perfil
          </Link>
        ) : estado.resultado === "fuera_de_zona" ? (
          <button type="button" onClick={alReintentar} className={blanco}>
            Probar otra vez
          </button>
        ) : (
          // Vencido, invalido o fuera de horario: reintentar con este mismo codigo no sirve.
          // Lo que hay que hacer es volver a la camara; aca solo se le deja cerrar el aviso.
          <button type="button" onClick={alReintentar} className={blanco}>
            Entendido
          </button>
        )}
        {!bien && (
          <Link href="/inicio" className="font-semibold opacity-90">
            Ir al inicio
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * Pide la ubicacion **en paralelo**, apenas se abre la pantalla, y nunca hace esperar al
 * boton. Si llega a tiempo, viaja con el marcaje; si no, el alumno marca igual.
 *
 * Esto es deliberado: el alumno tiene 60 segundos y el permiso del navegador es justo la
 * friccion que la decision 10 evito al descartar el escaner. Que un alumno que si fue pierda
 * su punto por un dialogo seria el peor error posible del sistema.
 * Ver docs/plan-geolocalizacion.md.
 */
function useUbicacion() {
  const ubicacion = useRef<{ lat: number; lon: number; precisionM: number | null } | null>(null);

  /**
   * `maximaEdadMs` es cuanta antiguedad se acepta de una lectura ya cacheada por el
   * navegador. Al abrir la pantalla conviene aceptarla: el alumno tiene 60 segundos y una
   * lectura inmediata vale mas que una exacta. Al reintentar NO, ver abajo.
   */
  const pedir = useCallback((maximaEdadMs = 30_000) => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        ubicacion.current = {
          lat: posicion.coords.latitude,
          lon: posicion.coords.longitude,
          precisionM: Number.isFinite(posicion.coords.accuracy)
            ? Math.round(posicion.coords.accuracy)
            : null,
        };
      },
      // Permiso negado, sin señal, o se acabo el tiempo: se sigue sin ubicacion.
      () => {},
      { enableHighAccuracy: true, timeout: 8000, maximumAge: maximaEdadMs },
    );
  }, []);

  useEffect(() => {
    pedir();
  }, [pedir]);

  return { ubicacion, pedir };
}

export function BotonMarcar({
  codigoCorto,
  codigo,
  puntos,
  esExtra,
}: {
  codigoCorto: string;
  codigo: string;
  puntos: number;
  esExtra: boolean;
}) {
  const [estado, accion, enviando] = useActionState(marcarAsistencia, estadoInicialMarcaje);
  const { ubicacion, pedir } = useUbicacion();
  // El resultado tapa la pantalla; un rechazo se puede cerrar para volver al boton.
  const [cerrado, setCerrado] = useState<EstadoMarcaje | null>(null);

  // Lo rechazaron por zona: se pide una lectura nueva y sin cache. Si no, el reintento
  // mandaria la misma posicion de antes de caminar y lo rechazaria otra vez, y el mensaje
  // "acercate y proba otra vez" seria imposible de cumplir.
  useEffect(() => {
    if (estado.resultado === "fuera_de_zona") pedir(0);
  }, [estado, pedir]);

  const hayResultado = estado.resultado !== null && estado !== cerrado;

  return (
    <>
      {hayResultado && (
        <Resultado estado={estado} puntos={puntos} esExtra={esExtra} alReintentar={() => setCerrado(estado)} />
      )}
      <form
        action={(datos) => {
          // Se adjunta lo que haya llegado hasta este instante. Si no llego nada, se
          // manda sin ubicacion: el boton nunca espera.
          const u = ubicacion.current;
          if (u) {
            datos.set("lat", String(u.lat));
            datos.set("lon", String(u.lon));
            if (u.precisionM !== null) datos.set("precisionM", String(u.precisionM));
          }
          return accion(datos);
        }}
      >
        <input type="hidden" name="codigoCorto" value={codigoCorto} />
        <input type="hidden" name="codigo" value={codigo} />
        {/* Un solo boton, grande: es lo unico que hay que hacer en esta pantalla. */}
        <Boton
          type="submit"
          disabled={enviando}
          className="!h-[68px] w-full !rounded-[20px] !text-lg shadow-[0_10px_26px_rgb(28_114_165_/_0.35)]"
        >
          {enviando ? "Marcando…" : "Marcar asistencia"}
        </Boton>
      </form>
    </>
  );
}
