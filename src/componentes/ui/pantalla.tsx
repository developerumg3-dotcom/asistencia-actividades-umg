import type { ReactNode } from "react";

/**
 * El contenedor de toda pantalla con barra inferior: una columna centrada, con el aire de
 * abajo que hace falta para que la barra no tape lo ultimo.
 */
export function Pantalla({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main className={`mx-auto flex w-full max-w-xl flex-col gap-4 px-4 pb-28 pt-5 ${className ?? ""}`}>
      {children}
    </main>
  );
}
