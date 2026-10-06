"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Vuelve a pedir la pagina cada tantos segundos, para que "En vivo" (B6) sea en vivo de
 * verdad y nadie tenga que recargar a mano a mitad de un evento. No pide nada mientras la
 * pestaña esta oculta: un telefono en el bolsillo no tiene por que seguir consultando.
 */
export function RefrescoAutomatico({ cadaSegundos = 8 }: { cadaSegundos?: number }) {
  const router = useRouter();

  useEffect(() => {
    const intervalo = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, cadaSegundos * 1000);
    return () => clearInterval(intervalo);
  }, [router, cadaSegundos]);

  return null;
}
