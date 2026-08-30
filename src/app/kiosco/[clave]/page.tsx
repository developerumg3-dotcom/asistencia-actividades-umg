import { PantallaKiosco } from "@/componentes/pantalla-kiosco";

export const dynamic = "force-dynamic";

/**
 * B5 — kiosco del QR. Se abre con la clave de pantalla, **no** con la sesion del
 * administrador: asi no queda una sesion con permisos abierta en la computadora del salon
 * (PLANIFICACION.md §6.3).
 *
 * La validez de la clave la comprueba `/api/kiosco/[clave]`, que es quien tiene el secreto.
 */
export default async function KioscoPage({ params }: { params: Promise<{ clave: string }> }) {
  const { clave } = await params;
  return <PantallaKiosco clave={clave} />;
}
