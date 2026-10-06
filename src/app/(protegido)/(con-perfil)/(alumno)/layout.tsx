import type { ReactNode } from "react";
import Link from "next/link";
import { BarraAlumno } from "@/componentes/barras";
import { obtenerEstadoPuntosExtra } from "@/lib/puntos/consulta";
import { requireAlumno } from "@/lib/sesion";

export const dynamic = "force-dynamic";

/**
 * Las pantallas del alumno: Puntos, Actividades, Extra, Cursos y Yo, con su barra inferior.
 *
 * Quien administra tambien cursa y entra aca a ver sus propios puntos: se le muestra una
 * cinta para volver al panel, que es donde vive su trabajo.
 */
export default async function AlumnoLayout({ children }: { children: ReactNode }) {
  const alumnoActual = await requireAlumno();
  const { saldoDisponible, repartoAbierto } = await obtenerEstadoPuntosExtra(alumnoActual.id);

  return (
    <>
      {alumnoActual.rol === "admin" && (
        <div className="border-b border-accent-100 bg-accent-50 text-accent-700">
          <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 py-2 text-[12.5px] font-semibold">
            <span>Estás viendo tus propios puntos</span>
            <Link href="/admin" className="underline">
              Volver al panel
            </Link>
          </div>
        </div>
      )}
      {children}
      {/* Un saldo que ya no se puede repartir no es un pendiente: no enciende el globo. */}
      <BarraAlumno saldoExtra={repartoAbierto ? saldoDisponible : 0} />
    </>
  );
}
