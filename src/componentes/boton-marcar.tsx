"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { marcarAsistencia, type EstadoMarcaje } from "@/app/a/[codigoCorto]/[codigo]/acciones";
import { Boton } from "@/componentes/ui/boton";

const estadoInicialMarcaje: EstadoMarcaje = { resultado: null, mensaje: null };

/** A7 — el resultado se muestra en la misma pantalla, sin navegar (PLANIFICACION.md §6.4). */
function Resultado({ estado }: { estado: EstadoMarcaje }) {
  if (!estado.resultado) return null;

  const exito = estado.resultado === "ok";
  const yaEstaba = estado.resultado === "duplicado";

  return (
    <div
      className={`rounded-md border p-4 ${
        exito || yaEstaba
          ? "border-emerald-300 bg-emerald-50 text-emerald-900"
          : "border-danger-300 bg-danger-50 text-danger-900"
      }`}
      role="status"
      aria-live="polite"
    >
      <p className="text-base font-medium">{estado.mensaje}</p>

      {estado.resultado === "expirado" && (
        <p className="mt-2 text-sm">
          Volvé a apuntar la cámara al QR de la pantalla. El código cambia cada minuto.
        </p>
      )}
      {estado.resultado === "sin_perfil" && (
        <Link href="/perfil/completar" className="mt-2 inline-block text-sm font-medium underline">
          Completar mi perfil
        </Link>
      )}
      {(exito || yaEstaba) && (
        <Link href="/inicio" className="mt-2 inline-block text-sm font-medium underline">
          Ir al inicio
        </Link>
      )}
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

  useEffect(() => {
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
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30_000 },
    );
  }, []);

  return ubicacion;
}

export function BotonMarcar({
  codigoCorto,
  codigo,
}: {
  codigoCorto: string;
  codigo: string;
}) {
  const [estado, accion, enviando] = useActionState(marcarAsistencia, estadoInicialMarcaje);
  const ubicacion = useUbicacion();

  // Ya resuelto: no tiene sentido dejar el boton para que lo pulse de nuevo.
  const terminado = estado.resultado === "ok" || estado.resultado === "duplicado";

  return (
    <div className="flex flex-col gap-4">
      <Resultado estado={estado} />
      {!terminado && (
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
          <Boton type="submit" disabled={enviando} className="w-full py-4 text-base">
            {enviando ? "Marcando…" : "Marcar asistencia"}
          </Boton>
        </form>
      )}
    </div>
  );
}
