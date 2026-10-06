import { ComoMarcar } from "@/componentes/como-marcar";
import { Etiqueta } from "@/componentes/ui/etiqueta";
import { Fechita } from "@/componentes/ui/fechita";
import { Icono } from "@/componentes/ui/icono";
import { Pantalla } from "@/componentes/ui/pantalla";
import { Tarjeta } from "@/componentes/ui/tarjeta";
import { Titular, TituloSeccion, Vacio } from "@/componentes/ui/titular";
import { marcajeAbierto, obtenerActividadesDelAlumno, type ActividadDelAlumno } from "@/lib/actividades";
import { fechaCortaEnGuatemala, horaEnGuatemala, relativoEnGuatemala } from "@/lib/fechas";
import { requireAlumno } from "@/lib/sesion";

export const dynamic = "force-dynamic";

function EtiquetaDePuntos({ a }: { a: ActividadDelAlumno }) {
  return (
    <Etiqueta tono="oro">
      {a.tipo === "extra" && "Extra · "}
      {a.puntos} {a.puntos === 1 ? "punto" : "puntos"}
    </Etiqueta>
  );
}

/**
 * A11 — Actividades. Tres secciones: "Ahora" (marcaje abierto), "Próximas" y "Ya pasaron".
 * Las dos primeras son tarjetas, porque ahi el alumno tiene algo que hacer o que agendar; las
 * pasadas van compactas, como linea de tiempo, porque son solo consulta.
 */
export default async function ActividadesPage() {
  const alumnoActual = await requireAlumno();
  const actividades = await obtenerActividadesDelAlumno(alumnoActual.id, { incluirCerradas: true });
  const ahora = new Date();

  const abiertas = actividades.filter((a) => marcajeAbierto(a, ahora));
  const proximas = actividades.filter((a) => a.estado === "publicada" && a.marcajeAbreEn > ahora);
  const pasadas = actividades
    .filter((a) => a.estado === "cerrada" || a.marcajeCierraEn < ahora)
    .reverse();

  const tarjeta = (a: ActividadDelAlumno, abierta: boolean) => (
    <li key={a.id} className="flex items-start gap-3 rounded-2xl bg-white p-3.5 shadow-tarjeta">
      <Fechita fecha={a.iniciaEn} tono={abierta ? "viva" : "normal"} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div>
          <p className="font-bold leading-snug">{a.nombre}</p>
          <p className="text-[13px] text-neutral-500">
            {horaEnGuatemala(a.iniciaEn)}
            {a.lugar && <> · {a.lugar}</>}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {a.marcadaEn ? (
            <Etiqueta tono="verde">
              <Icono nombre="ok" grosor={2.6} className="size-[13px]" />
              Asististe
            </Etiqueta>
          ) : abierta ? (
            <Etiqueta tono="azul">Abierta ahora</Etiqueta>
          ) : (
            <Etiqueta tono="celeste">{relativoEnGuatemala(a.iniciaEn, ahora)}</Etiqueta>
          )}
          <EtiquetaDePuntos a={a} />
        </div>
        {abierta && !a.marcadaEn && <ComoMarcar variante="suave" chico etiqueta="Cómo marco" />}
      </div>
    </li>
  );

  return (
    <Pantalla>
      <Titular titulo="Actividades" bajada="Cada asistencia suma en todas tus clases." />

      {actividades.length === 0 && <Vacio>Todavía no hay actividades publicadas.</Vacio>}

      {abiertas.length > 0 && (
        <>
          <TituloSeccion>Ahora</TituloSeccion>
          <ul className="flex flex-col gap-2.5">{abiertas.map((a) => tarjeta(a, true))}</ul>
        </>
      )}

      {proximas.length > 0 && (
        <>
          <TituloSeccion lado={proximas.length}>Próximas</TituloSeccion>
          <ul className="flex flex-col gap-2.5">{proximas.map((a) => tarjeta(a, false))}</ul>
        </>
      )}

      {pasadas.length > 0 && (
        <>
          <TituloSeccion lado={`asististe a ${pasadas.filter((a) => a.marcadaEn).length} de ${pasadas.length}`}>
            Ya pasaron
          </TituloSeccion>
          <Tarjeta>
            <ol className="flex flex-col">
              {pasadas.map((a, indice) => {
                const asistio = a.marcadaEn !== null;
                const ultima = indice === pasadas.length - 1;
                return (
                  <li key={a.id} className={`relative flex items-start gap-3 ${ultima ? "" : "pb-4"}`}>
                    {/* La linea que une un nodo con el siguiente. */}
                    {!ultima && (
                      <span aria-hidden className="absolute bottom-0.5 left-[15px] top-[34px] w-0.5 bg-linea" />
                    )}
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-full ${
                        asistio ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-400"
                      }`}
                    >
                      <Icono nombre={asistio ? "ok" : "x"} grosor={2.8} className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14.5px] font-bold leading-snug">{a.nombre}</p>
                      <p className="text-xs text-neutral-400">
                        {fechaCortaEnGuatemala(a.iniciaEn)}
                        {a.marcadaEn ? ` · marcaste ${horaEnGuatemala(a.marcadaEn)}` : " · no asististe"}
                      </p>
                    </div>
                    {a.tipo === "extra" && <Etiqueta tono="oro">Extra</Etiqueta>}
                    <b className={`tabular-nums ${asistio ? "text-primary-700" : "text-neutral-400"}`}>
                      {asistio ? `+${a.puntos}` : "0"}
                    </b>
                  </li>
                );
              })}
            </ol>
          </Tarjeta>
        </>
      )}
    </Pantalla>
  );
}
