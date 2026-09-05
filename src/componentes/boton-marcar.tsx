"use client";

import { useActionState } from "react";
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

export function BotonMarcar({
  codigoCorto,
  codigo,
}: {
  codigoCorto: string;
  codigo: string;
}) {
  const [estado, accion, enviando] = useActionState(marcarAsistencia, estadoInicialMarcaje);

  // Ya resuelto: no tiene sentido dejar el boton para que lo pulse de nuevo.
  const terminado = estado.resultado === "ok" || estado.resultado === "duplicado";

  return (
    <div className="flex flex-col gap-4">
      <Resultado estado={estado} />
      {!terminado && (
        <form action={accion}>
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
