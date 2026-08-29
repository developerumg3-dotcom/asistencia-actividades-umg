import { asc } from "drizzle-orm";
import { db } from "@/db/cliente";
import { actividad } from "@/db/esquema";
import {
  FormularioEditarActividad,
  FormularioNuevaActividad,
  type ActividadEditable,
} from "@/componentes/formulario-actividad";
import { Tarjeta } from "@/componentes/ui/tarjeta";
import { enGuatemala, haciaCampoLocal } from "@/lib/fechas";

const ETIQUETA_ESTADO: Record<string, string> = {
  borrador: "Borrador",
  publicada: "Publicada",
  cerrada: "Cerrada",
};

const CLASE_ESTADO: Record<string, string> = {
  borrador: "border-neutral-300 text-neutral-600",
  publicada: "border-primary-300 bg-primary-50 text-primary-800",
  cerrada: "border-neutral-200 bg-neutral-50 text-neutral-500",
};

export default async function ActividadesAdminPage() {
  // `secretoQr` NO se selecciona: no tiene por que salir del servidor, ni siquiera hacia el
  // administrador. PLANIFICACION.md §6.3.
  const actividades = await db
    .select({
      id: actividad.id,
      codigoCorto: actividad.codigoCorto,
      nombre: actividad.nombre,
      descripcion: actividad.descripcion,
      lugar: actividad.lugar,
      tipo: actividad.tipo,
      puntos: actividad.puntos,
      estado: actividad.estado,
      ventanaSeg: actividad.ventanaSeg,
      iniciaEn: actividad.iniciaEn,
      terminaEn: actividad.terminaEn,
      marcajeAbreEn: actividad.marcajeAbreEn,
      marcajeCierraEn: actividad.marcajeCierraEn,
    })
    .from(actividad)
    .orderBy(asc(actividad.iniciaEn));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Actividades</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Cada actividad genera su propio secreto para el QR rotativo. Las horas se muestran en
          hora de Guatemala.
        </p>
      </div>

      <FormularioNuevaActividad />

      <div className="flex flex-col gap-3">
        {actividades.length === 0 && (
          <p className="text-sm text-neutral-500">Todavía no hay actividades creadas.</p>
        )}

        {actividades.map((a) => {
          const editable: ActividadEditable = {
            id: a.id,
            codigoCorto: a.codigoCorto,
            nombre: a.nombre,
            descripcion: a.descripcion,
            lugar: a.lugar,
            tipo: a.tipo,
            puntos: a.puntos,
            estado: a.estado,
            ventanaSeg: a.ventanaSeg,
            iniciaEn: haciaCampoLocal(a.iniciaEn),
            terminaEn: haciaCampoLocal(a.terminaEn),
            marcajeAbreEn: haciaCampoLocal(a.marcajeAbreEn),
            marcajeCierraEn: haciaCampoLocal(a.marcajeCierraEn),
          };

          return (
            <Tarjeta key={a.id} className="flex flex-col gap-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-medium text-neutral-900">{a.nombre}</h2>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${CLASE_ESTADO[a.estado]}`}
                    >
                      {ETIQUETA_ESTADO[a.estado]}
                    </span>
                    <span className="rounded-full border border-accent-300 bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-800">
                      {a.tipo === "extra" ? "Extra" : "Global"} · {a.puntos}{" "}
                      {a.puntos === 1 ? "punto" : "puntos"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-neutral-600">
                    {enGuatemala(a.iniciaEn)} → {enGuatemala(a.terminaEn)}
                    {a.lugar && <> · {a.lugar}</>}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Marcaje: {enGuatemala(a.marcajeAbreEn)} → {enGuatemala(a.marcajeCierraEn)} ·
                    código cada {a.ventanaSeg} s
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Código corto: <span className="font-mono">{a.codigoCorto}</span>
                  </p>
                </div>
                <FormularioEditarActividad actividad={editable} />
              </div>
            </Tarjeta>
          );
        })}
      </div>
    </div>
  );
}
