"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

type CodigoProgramado = { codigo: string; vigenteDesde: string; url: string };

type Respuesta = {
  actividad: { nombre: string; lugar: string | null; estado: string; ventanaSeg: number };
  servidorEn: string;
  codigos: CodigoProgramado[];
};

/** Si no se logra recargar en este tiempo, los codigos precargados ya no valen. */
const TOLERANCIA_SIN_RED_MS = 5 * 60 * 1000;

/**
 * B5 — pantalla de kiosco.
 *
 * Pide al servidor el codigo vigente y **los siguientes cinco**. Con eso sigue rotando sola
 * aunque la red se caiga un momento; si se cae mas de cinco minutos, muestra una advertencia
 * en lugar de un QR que ya nadie puede validar (PLANIFICACION.md §6.3).
 *
 * El secreto no vive aca: solo llegan codigos ya derivados.
 */
export function PantallaKiosco({ clave }: { clave: string }) {
  const [datos, setDatos] = useState<Respuesta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ahora, setAhora] = useState(() => Date.now());
  const ultimoExitoRef = useRef<number>(Date.now());
  const lienzoRef = useRef<HTMLCanvasElement>(null);

  const recargar = useCallback(async () => {
    try {
      const respuesta = await fetch(`/api/kiosco/${clave}`, { cache: "no-store" });
      if (!respuesta.ok) {
        setError(respuesta.status === 404 ? "Pantalla no encontrada." : "No se pudo actualizar.");
        return;
      }
      setDatos((await respuesta.json()) as Respuesta);
      ultimoExitoRef.current = Date.now();
      setError(null);
    } catch {
      // Se calla: para eso estan los codigos precargados. La advertencia aparece sola si el
      // corte se alarga.
      setError("Sin conexión.");
    }
  }, [clave]);

  useEffect(() => {
    void recargar();
    const intervalo = setInterval(() => void recargar(), 60_000);
    return () => clearInterval(intervalo);
  }, [recargar]);

  useEffect(() => {
    const intervalo = setInterval(() => setAhora(Date.now()), 250);
    return () => clearInterval(intervalo);
  }, []);

  // Que la computadora del salon no bloquee la pantalla a mitad del evento.
  useEffect(() => {
    let candado: WakeLockSentinel | null = null;
    const pedir = async () => {
      try {
        candado = await navigator.wakeLock?.request("screen");
      } catch {
        // Sin Wake Lock se sigue: hay que desactivar la suspension a mano, esta anotado
        // en los riesgos del proyecto.
      }
    };
    void pedir();
    const alVolver = () => {
      if (document.visibilityState === "visible") void pedir();
    };
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      document.removeEventListener("visibilitychange", alVolver);
      void candado?.release();
    };
  }, []);

  const vigente = datos?.codigos
    .filter((c) => new Date(c.vigenteDesde).getTime() <= ahora)
    .at(-1);

  useEffect(() => {
    const lienzo = lienzoRef.current;
    if (!vigente || !lienzo) return;
    void QRCode.toCanvas(lienzo, vigente.url, {
      // Nivel M: tolera reflejos y angulos sin inflar la densidad (§6.3).
      errorCorrectionLevel: "M",
      margin: 2,
      // Resolucion del mapa de bits, no tamaño en pantalla: da nitidez al proyectarlo.
      width: 900,
      color: { dark: "#000000", light: "#ffffff" },
    }).then(() => {
      // `toCanvas` escribe `style="width:900px;height:900px"` en linea, y eso le gana a las
      // clases: el QR se salia de la pantalla. Se limpia para que mande el CSS.
      lienzo.style.removeProperty("width");
      lienzo.style.removeProperty("height");
    });
  }, [vigente]);

  const ventanaMs = (datos?.actividad.ventanaSeg ?? 60) * 1000;
  const restante = vigente
    ? Math.max(0, Math.ceil((new Date(vigente.vigenteDesde).getTime() + ventanaMs - ahora) / 1000))
    : 0;

  const sinRedHaceRato = ahora - ultimoExitoRef.current > TOLERANCIA_SIN_RED_MS;

  if (!datos && error) {
    return <Aviso titulo={error} detalle="Revisá la clave de la pantalla o la conexión." />;
  }
  if (!datos) {
    return <Aviso titulo="Cargando…" detalle="Pidiendo el código al servidor." />;
  }
  if (sinRedHaceRato || !vigente) {
    return (
      <Aviso
        titulo="Sin conexión"
        detalle="Los códigos precargados se agotaron. Nadie puede marcar hasta que vuelva la red."
      />
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-white p-6">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-neutral-900 sm:text-4xl">
          {datos.actividad.nombre}
        </h1>
        {datos.actividad.lugar && (
          <p className="mt-1 text-lg text-neutral-500">{datos.actividad.lugar}</p>
        )}
      </div>

      {/* El QR ocupa el maximo posible: tiene que leerse desde el fondo del salon. */}
      <canvas
        ref={lienzoRef}
        className="h-[min(60vh,60vw)] w-[min(60vh,60vw)] max-w-full"
        aria-label="Código QR para marcar asistencia"
      />

      <div className="flex flex-col items-center gap-2">
        <p className="text-xl text-neutral-600">Escaneá con la cámara de tu teléfono</p>
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold tabular-nums text-primary-700">{restante}</span>
          <span className="text-xl text-neutral-500">s</span>
        </div>
        <div className="h-2 w-64 overflow-hidden rounded-full bg-neutral-200">
          <div
            className="h-full bg-primary-600 transition-[width] duration-200"
            style={{ width: `${(restante / (ventanaMs / 1000)) * 100}%` }}
          />
        </div>
        {error && <p className="text-sm text-accent-700">Reintentando conexión…</p>}
      </div>
    </div>
  );
}

function Aviso({ titulo, detalle }: { titulo: string; detalle: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-white p-6 text-center">
      <h1 className="text-4xl font-semibold text-neutral-900">{titulo}</h1>
      <p className="text-xl text-neutral-600">{detalle}</p>
    </div>
  );
}
