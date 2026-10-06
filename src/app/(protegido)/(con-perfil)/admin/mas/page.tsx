import Link from "next/link";
import { count } from "drizzle-orm";
import { db } from "@/db/cliente";
import { docente } from "@/db/esquema";
import { Avatar } from "@/componentes/ui/avatar";
import { Icono, type NombreIcono } from "@/componentes/ui/icono";
import { Tarjeta } from "@/componentes/ui/tarjeta";
import { Titular } from "@/componentes/ui/titular";
import { cerrarSesion } from "@/lib/auth/acciones";
import { contarClasesSinCatedratico } from "@/lib/clases";
import { requireAdmin } from "@/lib/sesion";

export const dynamic = "force-dynamic";

function Opcion({ href, icono, titulo, detalle }: { href: string; icono: NombreIcono; titulo: string; detalle: string }) {
  return (
    <Link href={href} className="flex flex-col gap-2.5 rounded-2xl bg-white p-4 shadow-tarjeta transition active:scale-[.98]">
      <Icono nombre={icono} className="size-[26px] text-primary-600" />
      <span className="font-bold leading-snug">
        {titulo}
        <span className="block text-[12.5px] font-medium text-neutral-500">{detalle}</span>
      </span>
    </Link>
  );
}

/**
 * B12 — Más: lo que no cabe en la barra inferior del panel. Catedraticos, Clases y Bitacora
 * se usan cada tanto, no durante un evento; por eso viven a un toque de aca y no ocupan una
 * pestaña.
 */
export default async function MasAdminPage() {
  const alumnoActual = await requireAdmin();
  const [[{ total: catedraticos }], sinCatedratico] = await Promise.all([
    db.select({ total: count() }).from(docente),
    contarClasesSinCatedratico(),
  ]);

  return (
    <>
      <Titular titulo="Más" />

      <Tarjeta className="flex items-center gap-3">
        <Avatar nombre={alumnoActual.nombre} tono="oro" className="!size-[52px]" />
        <div className="min-w-0">
          <p className="text-base font-bold leading-snug">{alumnoActual.nombre ?? "Administración"}</p>
          <p className="truncate text-xs text-neutral-400">{alumnoActual.email} · Administrador</p>
        </div>
      </Tarjeta>

      <div className="grid grid-cols-2 gap-2.5">
        <Opcion
          href="/admin/catedraticos"
          icono="birrete"
          titulo="Catedráticos"
          detalle={`${catedraticos} · reportes en Excel`}
        />
        <Opcion
          href="/admin/clases"
          icono="libro"
          titulo="Clases"
          detalle={sinCatedratico > 0 ? `${sinCatedratico} sin catedrático` : "El catálogo del pensum"}
        />
        <Opcion href="/admin/bitacora" icono="escudo" titulo="Bitácora" detalle="Intentos de marcaje y señales" />
        <Opcion href="/inicio" icono="puntos" titulo="Mis puntos" detalle="Verme como alumno" />
      </div>

      <form action={cerrarSesion}>
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-2xl bg-white p-3.5 text-left font-bold text-neutral-500 shadow-tarjeta"
        >
          <Icono nombre="salir" />
          Cerrar sesión
        </button>
      </form>
    </>
  );
}
