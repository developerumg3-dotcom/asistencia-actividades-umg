"use client";

import { usePathname } from "next/navigation";
import { EnlaceBoton } from "@/componentes/ui/boton";

/**
 * Entrada al panel, para quien administra y esta parado en la vista de alumno.
 *
 * Antes este boton se mostraba tambien dentro del panel, apuntando a la pagina en la que ya
 * estabas: un boton muerto. Y la salida vivia al final de la barra de pestañas como "Mis
 * clases", pegada a "Clases" —el catalogo de cursos, cosa completamente distinta—: dos
 * nombres parecidos para significados opuestos. Ahora los cursos propios son una pestaña mas
 * (/admin/mis-clases) y aca no queda nada que ofrecer.
 */
export function CambioDeVista() {
  const pathname = usePathname();
  const enAdmin = pathname.startsWith("/admin");

  // Dentro del panel no se ofrece nada: todo, incluidos los cursos propios, es una pestaña
  // de la barra. Un boton de salida ahi solo competia con ellas.
  if (enAdmin) return null;

  return (
    <EnlaceBoton href="/admin/actividades" variante="secundario">
      Administración
    </EnlaceBoton>
  );
}
