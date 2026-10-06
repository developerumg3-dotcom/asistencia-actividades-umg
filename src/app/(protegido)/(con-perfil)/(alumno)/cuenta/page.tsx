import Link from "next/link";
import { ActivarAvisos } from "@/componentes/activar-avisos";
import { Avatar } from "@/componentes/ui/avatar";
import { Icono, type NombreIcono } from "@/componentes/ui/icono";
import { Pantalla } from "@/componentes/ui/pantalla";
import { Tarjeta } from "@/componentes/ui/tarjeta";
import { Titular } from "@/componentes/ui/titular";
import { cerrarSesion } from "@/lib/auth/acciones";
import { clavePublicaVapid } from "@/lib/push/vapid";
import { requireAlumno } from "@/lib/sesion";

export const dynamic = "force-dynamic";

function Renglon({ href, icono, titulo, detalle }: { href: string; icono: NombreIcono; titulo: string; detalle: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-tarjeta">
      <Icono nombre={icono} />
      <div className="min-w-0 flex-1">
        <p className="font-bold leading-snug">{titulo}</p>
        <p className="text-[13px] text-neutral-500">{detalle}</p>
      </div>
      <Icono nombre="der" className="text-neutral-400" />
    </Link>
  );
}

/** A12 — Mi cuenta: quien soy, los avisos en este dispositivo, instalar la app y salir. */
export default async function CuentaPage() {
  const alumnoActual = await requireAlumno();

  return (
    <Pantalla>
      <Titular titulo="Mi cuenta" />

      <Tarjeta className="flex items-center gap-3">
        <Avatar nombre={alumnoActual.nombre} tono="azul" className="!size-14 !text-lg" />
        <div className="min-w-0">
          <p className="text-[17px] font-bold leading-snug">{alumnoActual.nombre ?? "Sin nombre"}</p>
          <p className="text-[13px] text-neutral-500">
            Carné {alumnoActual.carne ?? "—"}
            {alumnoActual.ciclo && <> · Ciclo {alumnoActual.ciclo}</>}
          </p>
          <p className="truncate text-xs text-neutral-400">{alumnoActual.email}</p>
        </div>
      </Tarjeta>

      {/*
        El permiso de notificaciones se pide recien cuando el alumno pulsa el boton, nunca al
        cargar: un "Bloquear" por reflejo lo deja inalcanzable para siempre.
        Ver docs/plan-notificaciones-push.md.
      */}
      <ActivarAvisos clavePublica={clavePublicaVapid()} />

      <div className="flex flex-col gap-2.5">
        <Renglon
          href="/ayuda/instalar-ios"
          icono="celular"
          titulo="Instalar la app en mi iPhone"
          detalle="Queda en tu pantalla de inicio, como cualquier otra."
        />
        {alumnoActual.rol === "admin" && (
          <Renglon href="/admin" icono="cambio" titulo="Volver a Administración" detalle="El panel de actividades y alumnos." />
        )}
        <form action={cerrarSesion}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-2xl bg-white p-3.5 text-left font-bold text-neutral-500 shadow-tarjeta"
          >
            <Icono nombre="salir" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </Pantalla>
  );
}
