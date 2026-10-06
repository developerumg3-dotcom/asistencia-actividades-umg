import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db/cliente";
import { actividad, alumno, asistencia, pantalla } from "@/db/esquema";
import { asegurarPantalla } from "@/app/(protegido)/(con-perfil)/admin/actividades/acciones";
import { BotonAvisarActividad } from "@/componentes/boton-avisar-actividad";
import { FormularioEditarActividad, type ActividadEditable } from "@/componentes/formulario-actividad";
import { FormularioMarcajeManual } from "@/componentes/formulario-marcaje-manual";
import { RefrescoAutomatico } from "@/componentes/refresco-automatico";
import { Avatar } from "@/componentes/ui/avatar";
import { clasesAccion, CuerpoAccion } from "@/componentes/ui/boton-accion";
import { Etiqueta } from "@/componentes/ui/etiqueta";
import { Fechita } from "@/componentes/ui/fechita";
import { Icono } from "@/componentes/ui/icono";
import { Tarjeta } from "@/componentes/ui/tarjeta";
import { SubBarra, TituloSeccion, Vacio } from "@/componentes/ui/titular";
import { enGuatemala, haciaCampoLocal, horaEnGuatemala } from "@/lib/fechas";
import { requireAdmin } from "@/lib/sesion";

// Se recarga sola (`RefrescoAutomatico`): durante el evento interesa el numero de ahora.
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * B6 — el detalle de una actividad: quien va marcando, en vivo mientras el marcaje esta
 * abierto, y las acciones sobre ella (kiosco, marcaje manual B8, avisar, editar).
 */
export default async function EnVivoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  // `secretoQr` NO se selecciona: no sale del servidor ni hacia el administrador (§6.3).
  const [laActividad] = await db
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
      exigeUbicacion: actividad.exigeUbicacion,
    })
    .from(actividad)
    .where(eq(actividad.id, id))
    .limit(1);

  if (!laActividad) notFound();

  const [marcajes, [laPantalla]] = await Promise.all([
    db
      .select({
        id: asistencia.id,
        alumnoId: asistencia.alumnoId,
        marcadaEn: asistencia.marcadaEn,
        origen: asistencia.origen,
        notaManual: asistencia.notaManual,
        distanciaM: asistencia.distanciaM,
        precisionM: asistencia.precisionM,
        nombre: alumno.nombre,
        carne: alumno.carne,
        email: alumno.email,
      })
      .from(asistencia)
      .innerJoin(alumno, eq(alumno.id, asistencia.alumnoId))
      .where(eq(asistencia.actividadId, id))
      .orderBy(desc(asistencia.marcadaEn)),
    db
      .select({ clave: pantalla.clave })
      .from(pantalla)
      .where(and(eq(pantalla.actividadId, id), eq(pantalla.activa, true)))
      .limit(1),
  ]);

  const ahora = new Date();
  const abierto =
    laActividad.estado === "publicada" && ahora >= laActividad.marcajeAbreEn && ahora <= laActividad.marcajeCierraEn;
  const radioM = laActividad.radioM;
  const fueraDeZona = (m: (typeof marcajes)[number]) =>
    radioM !== null && m.distanciaM !== null && m.distanciaM - (m.precisionM ?? 0) > radioM;
  // Recien llegado: marco hace menos de lo que tarda un refresco. Se resalta un instante.
  const esReciente = (fecha: Date) => ahora.getTime() - fecha.getTime() < 10_000;

  const editable: ActividadEditable = {
    id: laActividad.id,
    codigoCorto: laActividad.codigoCorto,
    nombre: laActividad.nombre,
    descripcion: laActividad.descripcion,
    lugar: laActividad.lugar,
    tipo: laActividad.tipo,
    puntos: laActividad.puntos,
    estado: laActividad.estado,
    ventanaSeg: laActividad.ventanaSeg,
    iniciaEn: haciaCampoLocal(laActividad.iniciaEn),
    terminaEn: haciaCampoLocal(laActividad.terminaEn),
    marcajeAbreEn: haciaCampoLocal(laActividad.marcajeAbreEn),
    marcajeCierraEn: haciaCampoLocal(laActividad.marcajeCierraEn),
    lat: laActividad.lat?.toString() ?? "",
    lon: laActividad.lon?.toString() ?? "",
    radioM: laActividad.radioM?.toString() ?? "",
    exigeUbicacion: laActividad.exigeUbicacion,
  };

  return (
    <>
      {abierto && <RefrescoAutomatico />}
      <SubBarra titulo="Actividad" volverA="/admin/actividades" />

      <Tarjeta className="flex items-start gap-3">
        <Fechita fecha={laActividad.iniciaEn} tono={abierto ? "viva" : "normal"} />
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-bold leading-snug">{laActividad.nombre}</p>
          <p className="text-[13px] text-neutral-500">
            {enGuatemala(laActividad.iniciaEn)} · {laActividad.lugar ?? "Sin lugar"}
          </p>
          {laActividad.descripcion && <p className="mt-1 text-[13px] text-neutral-500">{laActividad.descripcion}</p>}
          <p className="mt-1 text-xs text-neutral-400">
            Código QR <span className="font-mono">{laActividad.codigoCorto}</span> · cambia cada{" "}
            {laActividad.ventanaSeg} s
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {laActividad.estado === "borrador" ? (
              <Etiqueta>Borrador</Etiqueta>
            ) : laActividad.estado === "cerrada" ? (
              <Etiqueta>Cerrada</Etiqueta>
            ) : abierto ? (
              <Etiqueta tono="azul">Abierta ahora</Etiqueta>
            ) : (
              <Etiqueta tono="celeste">Publicada</Etiqueta>
            )}
            <Etiqueta tono="oro">
              {laActividad.tipo === "extra" && "Extra · "}
              {laActividad.puntos} {laActividad.puntos === 1 ? "punto" : "puntos"}
            </Etiqueta>
            {radioM !== null && (
              <Etiqueta>
                <Icono nombre="lugar" grosor={2.4} className="size-[13px]" />
                Zona {radioM} m
              </Etiqueta>
            )}
          </div>
        </div>
      </Tarjeta>

      <Tarjeta className="flex items-center gap-3">
        {abierto && (
          <span aria-hidden className="size-2.5 shrink-0 rounded-full bg-emerald-600 [animation:pulso_1.8s_infinite]" />
        )}
        <div className="flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            {abierto ? "En vivo · se actualiza solo" : "Asistencias registradas"}
          </p>
          <p className="text-[54px] font-extrabold leading-none tabular-nums tracking-tight text-primary-700">
            {marcajes.length}
          </p>
        </div>
        <p className="text-right text-[13px] text-neutral-500">
          {abierto ? "cierra" : "marcaje hasta"}
          <br />
          <b className="text-tinta">
            {abierto ? horaEnGuatemala(laActividad.marcajeCierraEn) : enGuatemala(laActividad.marcajeCierraEn)}
          </b>
        </p>
      </Tarjeta>

      <div className="grid grid-cols-4 gap-2">
        {laPantalla ? (
          <a href={`/kiosco/${laPantalla.clave}`} target="_blank" rel="noopener" className={clasesAccion}>
            <CuerpoAccion icono="pantalla">Abrir kiosco</CuerpoAccion>
          </a>
        ) : (
          <form action={asegurarPantalla}>
            <input type="hidden" name="actividadId" value={id} />
            <button type="submit" className={clasesAccion}>
              <CuerpoAccion icono="pantalla">Crear kiosco</CuerpoAccion>
            </button>
          </form>
        )}
        <FormularioMarcajeManual actividadId={id} />
        <BotonAvisarActividad actividadId={id} />
        <FormularioEditarActividad actividad={editable} />
      </div>

      {radioM !== null && marcajes.length > 0 && (
        <p className="text-[13px] text-neutral-500">
          Zona declarada de {radioM} m · {marcajes.filter((m) => m.distanciaM === null).length} sin ubicación ·{" "}
          {marcajes.filter(fueraDeZona).length} fuera del radio.{" "}
          {/* El dato importa: con el bloqueo encendido, "fuera del radio" son marcajes que
              no llegaron a existir, no asistencias dudosas. */}
          {laActividad.exigeUbicacion ? (
            <>
              <strong className="font-bold">Se rechaza</strong> a quien quede fuera con una lectura buena.
            </>
          ) : (
            <>
              <strong className="font-bold">Solo se registra</strong>, no bloquea.
            </>
          )}
        </p>
      )}

      <TituloSeccion>Quiénes marcaron</TituloSeccion>

      {marcajes.length === 0 ? (
        <Vacio>
          <p className="font-bold text-tinta">Todavía no marcó nadie</p>
          <p className="mt-1">Van a aparecer acá apenas escaneen.</p>
        </Vacio>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {marcajes.map((m) => (
            <li key={m.id}>
              <Link
                href={`/admin/alumnos/${m.alumnoId}`}
                className={`flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-tarjeta ${
                  esReciente(m.marcadaEn) ? "[animation:recien-llegado_1.8s]" : ""
                }`}
              >
                <Avatar nombre={m.nombre ?? m.email} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14.5px] font-bold leading-snug">{m.nombre ?? m.email}</p>
                  <p className="text-xs text-neutral-400">
                    {m.carne ?? "Sin carné"}
                    {radioM !== null && (
                      <>
                        {" · "}
                        {m.distanciaM === null ? (
                          // Nego el permiso o el telefono no dio posicion. No es sospechoso:
                          // la ubicacion es opcional.
                          "sin ubicación"
                        ) : (
                          <span
                            className={fueraDeZona(m) ? "font-bold text-accent-700" : ""}
                            title={m.precisionM ? `Precisión ±${m.precisionM} m` : undefined}
                          >
                            {m.distanciaM} m{fueraDeZona(m) && " · fuera"}
                          </span>
                        )}
                      </>
                    )}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <p className="text-[13.5px] font-bold tabular-nums">{horaEnGuatemala(m.marcadaEn)}</p>
                  {m.origen === "manual" ? (
                    <span title={m.notaManual ?? undefined}>
                      <Etiqueta tono="oro">Manual</Etiqueta>
                    </span>
                  ) : (
                    <Etiqueta>QR</Etiqueta>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
