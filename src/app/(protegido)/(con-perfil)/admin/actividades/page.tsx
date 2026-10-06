import Link from "next/link";
import { count, desc } from "drizzle-orm";
import { db } from "@/db/cliente";
import { actividad, asistencia } from "@/db/esquema";
import { FormularioNuevaActividad } from "@/componentes/formulario-actividad";
import { EnlaceChip, FilaDeChips } from "@/componentes/ui/chip";
import { Etiqueta } from "@/componentes/ui/etiqueta";
import { Fechita } from "@/componentes/ui/fechita";
import { Titular, Vacio } from "@/componentes/ui/titular";
import { horaEnGuatemala, relativoEnGuatemala } from "@/lib/fechas";

const FILTROS = [
  { valor: "", etiqueta: "Todas" },
  { valor: "publicada", etiqueta: "Publicadas" },
  { valor: "borrador", etiqueta: "Borradores" },
  { valor: "cerrada", etiqueta: "Cerradas" },
] as const;

/**
 * B4 — la lista de actividades. Cada tarjeta lleva al detalle (`/en-vivo`), que es donde
 * estan las acciones: kiosco, marcaje manual, avisar y editar. Asi la lista se lee de un
 * vistazo aunque haya muchas, que es para lo que estan los filtros.
 */
export default async function ActividadesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>;
}) {
  const { estado } = await searchParams;
  const filtro = FILTROS.some((f) => f.valor === estado) ? (estado ?? "") : "";

  // `secretoQr` NO se selecciona: no tiene por que salir del servidor, ni siquiera hacia el
  // administrador. PLANIFICACION.md §6.3.
  const [actividades, conteos] = await Promise.all([
    db
      .select({
        id: actividad.id,
        nombre: actividad.nombre,
        lugar: actividad.lugar,
        tipo: actividad.tipo,
        puntos: actividad.puntos,
        estado: actividad.estado,
        iniciaEn: actividad.iniciaEn,
        marcajeAbreEn: actividad.marcajeAbreEn,
        marcajeCierraEn: actividad.marcajeCierraEn,
      })
      .from(actividad)
      .orderBy(desc(actividad.iniciaEn)),
    db
      .select({ actividadId: asistencia.actividadId, total: count() })
      .from(asistencia)
      .groupBy(asistencia.actividadId),
  ]);
  const asistenciasDe = new Map(conteos.map((c) => [c.actividadId, c.total]));
  const publicadas = actividades.filter((a) => a.estado === "publicada").length;
  const visibles = filtro ? actividades.filter((a) => a.estado === filtro) : actividades;
  const ahora = new Date();

  return (
    <>
      <Titular
        titulo="Actividades"
        bajada={
          actividades.length === 0
            ? "Cada actividad genera su propio QR rotativo."
            : `${actividades.length} en total · ${publicadas} ${publicadas === 1 ? "publicada" : "publicadas"}`
        }
      />

      <FilaDeChips>
        {FILTROS.map((f) => (
          <EnlaceChip
            key={f.valor}
            href={f.valor ? `/admin/actividades?estado=${f.valor}` : "/admin/actividades"}
            activo={filtro === f.valor}
          >
            {f.etiqueta}
          </EnlaceChip>
        ))}
      </FilaDeChips>

      {visibles.length === 0 ? (
        <Vacio>
          {actividades.length === 0 ? (
            <>
              <p className="font-bold text-tinta">Todavía no hay actividades</p>
              <p className="mt-1">Creá la primera con el botón «Nueva» para poder proyectar su QR.</p>
            </>
          ) : (
            "No hay actividades con ese filtro."
          )}
        </Vacio>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {visibles.map((a) => {
            const abierta = a.estado === "publicada" && ahora >= a.marcajeAbreEn && ahora <= a.marcajeCierraEn;
            const apagada = a.estado !== "publicada" || a.marcajeCierraEn < ahora;
            const total = asistenciasDe.get(a.id) ?? 0;
            return (
              <li key={a.id}>
                <Link
                  href={`/admin/actividades/${a.id}/en-vivo`}
                  className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-tarjeta transition active:scale-[.985]"
                >
                  <Fechita fecha={a.iniciaEn} tono={abierta ? "viva" : apagada ? "apagada" : "normal"} />
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div>
                      <p className="font-bold leading-snug">{a.nombre}</p>
                      <p className="truncate text-[13px] text-neutral-500">
                        {horaEnGuatemala(a.iniciaEn)} · {a.lugar ?? "Sin lugar"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {a.estado === "borrador" ? (
                        <Etiqueta>Borrador</Etiqueta>
                      ) : a.estado === "cerrada" ? (
                        <Etiqueta>Cerrada</Etiqueta>
                      ) : abierta ? (
                        <Etiqueta tono="azul">Abierta ahora</Etiqueta>
                      ) : a.marcajeAbreEn > ahora ? (
                        <Etiqueta tono="celeste">{relativoEnGuatemala(a.iniciaEn, ahora)}</Etiqueta>
                      ) : (
                        <Etiqueta>Ya pasó</Etiqueta>
                      )}
                      <Etiqueta tono="oro">
                        {a.tipo === "extra" && "Extra · "}
                        {a.puntos} {a.puntos === 1 ? "punto" : "puntos"}
                      </Etiqueta>
                    </div>
                  </div>
                  <div className="text-right leading-tight">
                    <b className="text-xl font-extrabold tabular-nums">{total}</b>
                    <p className="text-xs text-neutral-400">asist.</p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <FormularioNuevaActividad />
    </>
  );
}
