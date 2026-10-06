import type { ReactNode } from "react";
import Image from "next/image";

/**
 * Cabecera de las pantallas de entrada (ingreso, registro, perfil, contraseña): el escudo,
 * un titulo y una bajada, centrados.
 */
export function Marca({ titulo, bajada }: { titulo: ReactNode; bajada?: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center">
      <Image src="/escudo-umg.webp" alt="Escudo de la Universidad Mariano Gálvez" width={76} height={76} priority />
      <h1 className="mt-2.5 text-[28px] font-extrabold leading-tight tracking-tight">{titulo}</h1>
      {bajada && <p className="mt-1 max-w-xs text-sm text-neutral-500">{bajada}</p>}
    </div>
  );
}

/** El lienzo de una pantalla de entrada: una columna angosta, centrada en alto si cabe. */
export function PantallaDeEntrada({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-5 px-5 py-9">{children}</main>
  );
}
