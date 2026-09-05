import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db/cliente";
import { actividad, pantalla } from "@/db/esquema";
import { asegurarPantalla } from "@/app/(protegido)/(con-perfil)/admin/actividades/acciones";
import { Boton } from "@/componentes/ui/boton";
import {
  FormularioEditarActividad,
  FormularioNuevaActividad,
  type ActividadEditable,
} from "@/componentes/formulario-actividad";
import { enGuatemala, haciaCampoLocal } from "@/lib/fechas";

const ETIQUETA_ESTADO: Record<string, string> = {
  borrador: "Borrador",
  publicada: "Publicada",
  cerrada: "Cerrada",
};

const CLASE_ESTADO: Record<string, string> = {
  borrador: "border-neutral-300 bg-white text-neutral-600",
  publicada: "border-primary-300 bg-primary-50 text-primary-800",
  cerrada: "border-neutral-200 bg-neutral-100 text-neutral-500",
};

/** Franja de color al costado de la tarjeta: el estado se lee sin buscar la insignia. */
const FRANJA_ESTADO: Record<string, string> = {
  borrador: "bg-neutral-300",
  publicada: "bg-primary-600",
  cerrada: "bg-neutral-200",
};

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs uppercase tracking-wide text-neutral-500">{etiqueta}</dt>
      <dd className="text-sm text-neutral-900">{children}</dd>
    </div>
  );
}

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
      lat: actividad.lat,
      lon: actividad.lon,
      radioM: actividad.radioM,
    })
    .from(actividad)
    .orderBy(asc(actividad.iniciaEn));

  const pantallas = await db
    .select({ actividadId: pantalla.actividadId, clave: pantalla.clave })
    .from(pantalla)
    .where(eq(pantalla.activa, true));
  const claveDe = new Map(pantallas.map((p) => [p.actividadId, p.clave]));

  const publicadas = actividades.filter((a) => a.estado === "publicada").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Actividades</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {actividades.length === 0
            ? "Cada actividad genera su propio QR rotativo."
            : `${actividades.length} ${actividades.length === 1 ? "actividad" : "actividades"} · ${publicadas} ${publicadas === 1 ? "publicada" : "publicadas"}`}
        </p>
      </div>

      <FormularioNuevaActividad />

      {actividades.length === 0 ? (
        <div className="rounded-md border border-dashed border-neutral-300 px-4 py-12 text-center">
          <p className="text-sm font-medium text-neutral-700">Todavía no hay actividades.</p>
          <p className="mt-1 text-sm text-neutral-500">
            Creá la primera para poder proyectar su QR en el evento.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
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
              lat: a.lat?.toString() ?? "",
              lon: a.lon?.toString() ?? "",
              radioM: a.radioM?.toString() ?? "",
            };

            return (
              <article
                key={a.id}
                className="flex overflow-hidden rounded-md border border-neutral-200 bg-white"
              >
                <div className={`w-1 shrink-0 ${FRANJA_ESTADO[a.estado]}`} aria-hidden />
                <div className="flex min-w-0 flex-1 flex-col gap-4 p-4">
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
                    {a.descripcion && (
                      <p className="mt-1 text-sm text-neutral-600">{a.descripcion}</p>
                    )}
                  </div>

                  <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Dato etiqueta="Ocurre">
                      {enGuatemala(a.iniciaEn)}
                      <span className="block text-xs text-neutral-500">
                        hasta {enGuatemala(a.terminaEn)}
                      </span>
                    </Dato>
                    <Dato etiqueta="Se puede marcar">
                      {enGuatemala(a.marcajeAbreEn)}
                      <span className="block text-xs text-neutral-500">
                        hasta {enGuatemala(a.marcajeCierraEn)}
                      </span>
                    </Dato>
                    <Dato etiqueta="Lugar">
                      {a.lugar ?? <span className="text-neutral-400">Sin definir</span>}
                    </Dato>
                    <Dato etiqueta="Zona">
                      {a.radioM ? (
                        <>
                          {a.radioM} m
                          <span className="block text-xs text-neutral-500">
                            solo se registra
                          </span>
                        </>
                      ) : (
                        <span className="text-neutral-400">Sin declarar</span>
                      )}
                    </Dato>
                    <Dato etiqueta="Código QR">
                      <span className="font-mono">{a.codigoCorto}</span>
                      <span className="block text-xs text-neutral-500">
                        cambia cada {a.ventanaSeg} s
                      </span>
                    </Dato>
                  </dl>

                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <Link
                      href={`/admin/actividades/${a.id}/en-vivo`}
                      className="text-sm text-primary-700 underline hover:text-primary-800"
                    >
                      Ver en vivo
                    </Link>
                    {claveDe.has(a.id) ? (
                      <a
                        href={`/kiosco/${claveDe.get(a.id)}`}
                        target="_blank"
                        rel="noopener"
                        className="text-sm text-primary-700 underline hover:text-primary-800"
                      >
                        Abrir kiosco ↗
                      </a>
                    ) : (
                      <form action={asegurarPantalla}>
                        <input type="hidden" name="actividadId" value={a.id} />
                        <Boton type="submit" variante="enlace">
                          Generar pantalla de kiosco
                        </Boton>
                      </form>
                    )}
                    <FormularioEditarActividad actividad={editable} />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
