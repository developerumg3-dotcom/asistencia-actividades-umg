import { and, count, eq, gte, lte } from "drizzle-orm";
import Link from "next/link";
import type { ReactNode } from "react";
import { db } from "@/db/cliente";
import { actividad, alumno, asistencia, pantalla } from "@/db/esquema";
import { Avatar } from "@/componentes/ui/avatar";
import { clasesDeBoton } from "@/componentes/ui/boton";
import { Icono, type NombreIcono } from "@/componentes/ui/icono";
import { Tarjeta } from "@/componentes/ui/tarjeta";
import { Titular, TituloSeccion } from "@/componentes/ui/titular";
import { detectarSenales } from "@/lib/bitacora/senales";
import { listarBitacora } from "@/lib/bitacora/consulta";
import { contarClasesSinCatedratico } from "@/lib/clases";
import { enGuatemala, horaEnGuatemala, inicioDeHoyEnGuatemala } from "@/lib/fechas";
import { avisoEsUrgente } from "@/lib/puntos/calculo";
import { contarAlumnosConSaldoPendiente, fechaDeCorteVigente } from "@/lib/puntos/consulta";
import { requireAdmin } from "@/lib/sesion";

// Numeros que cambian con cada marcaje: igual criterio que B6, no tiene sentido cachear esto.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const VENTANA_ALERTA_FALLOS_MIN = 60;

async function actividadConMarcajeAbierto() {
  const ahora = new Date();
  const [fila] = await db
    .select({
      id: actividad.id,
      nombre: actividad.nombre,
      lugar: actividad.lugar,
      marcajeCierraEn: actividad.marcajeCierraEn,
    })
    .from(actividad)
    .where(and(eq(actividad.estado, "publicada"), lte(actividad.marcajeAbreEn, ahora), gte(actividad.marcajeCierraEn, ahora)))
    .limit(1);
  if (!fila) return null;

  // Cuantos van y, si ya tiene pantalla, su clave: son los dos atajos del tablero.
  const [[{ total }], [laPantalla]] = await Promise.all([
    db.select({ total: count() }).from(asistencia).where(eq(asistencia.actividadId, fila.id)),
    db
      .select({ clave: pantalla.clave })
      .from(pantalla)
      .where(and(eq(pantalla.actividadId, fila.id), eq(pantalla.activa, true)))
      .limit(1),
  ]);
  return { ...fila, asistencias: total, claveKiosco: laPantalla?.clave ?? null };
}

/** B1 — panorama general: numeros del dia y alertas para decidir, nunca acciones automaticas. */
export default async function TableroAdminPage() {
  const alumnoActual = await requireAdmin();
  const ahora = new Date();
  const desdeHoy = inicioDeHoyEnGuatemala(ahora);
  const desdeAlertaFallos = new Date(ahora.getTime() - VENTANA_ALERTA_FALLOS_MIN * 60_000);

  const [
    laActividadAbierta,
    [{ total: asistenciasHoy }],
    [{ total: totalAlumnos }],
    [{ total: publicadas }],
    clasesSinCatedratico,
    saldoPendiente,
    fechaDeCorte,
    eventosRecientes,
  ] = await Promise.all([
    actividadConMarcajeAbierto(),
    db.select({ total: count() }).from(asistencia).where(gte(asistencia.marcadaEn, desdeHoy)),
    db.select({ total: count() }).from(alumno),
    db.select({ total: count() }).from(actividad).where(eq(actividad.estado, "publicada")),
    contarClasesSinCatedratico(),
    contarAlumnosConSaldoPendiente(),
    fechaDeCorteVigente(),
    listarBitacora({ desde: desdeAlertaFallos }),
  ]);

  const { porIntentosFallidos, porDispositivoCompartido } = detectarSenales(eventosRecientes);
  const alumnosConFallos = new Set(eventosRecientes.filter((e) => porIntentosFallidos.has(e.id)).map((e) => e.alumnoId)).size;
  const dispositivosCompartidos = new Set(
    eventosRecientes.filter((e) => porDispositivoCompartido.has(e.id)).map((e) => e.dispositivoId),
  ).size;

  const corteEsUrgente = avisoEsUrgente(ahora, fechaDeCorte);

  type Alerta = { icono: NombreIcono; texto: ReactNode; enlace?: { href: string; etiqueta: string } };

  const alertas: Alerta[] = (
    [
      clasesSinCatedratico > 0 && {
      icono: "birrete",
      texto: (
        <>
          <strong className="font-bold">{clasesSinCatedratico}</strong>{" "}
          {clasesSinCatedratico === 1 ? "clase no tiene" : "clases no tienen"} catedrático asignado y no se
          pueden exportar.
        </>
      ),
      enlace: { href: "/admin/clases", etiqueta: "Asignar" },
    },
    saldoPendiente > 0 &&
      fechaDeCorte && {
        icono: "regalo",
        texto: (
          <>
            <strong className="font-bold">{saldoPendiente}</strong>{" "}
            {saldoPendiente === 1 ? "alumno tiene" : "alumnos tienen"} saldo de puntos extra sin repartir
            {corteEsUrgente ? ", y el corte es en menos de 24 horas" : ""} — corte el {enGuatemala(fechaDeCorte)}
          </>
        ),
      },
    (alumnosConFallos > 0 || dispositivosCompartidos > 0) && {
      icono: "alerta",
      texto: (
        <>
          Actividad reciente en la bitácora que conviene revisar: {alumnosConFallos > 0 && (
            <>
              <strong className="font-bold">{alumnosConFallos}</strong>{" "}
              {alumnosConFallos === 1 ? "alumno con" : "alumnos con"} varios intentos fallidos seguidos
            </>
          )}
          {alumnosConFallos > 0 && dispositivosCompartidos > 0 && " · "}
          {dispositivosCompartidos > 0 && (
            <>
              <strong className="font-bold">{dispositivosCompartidos}</strong>{" "}
              {dispositivosCompartidos === 1 ? "dispositivo detrás de varios alumnos" : "dispositivos detrás de varios alumnos"}
            </>
          )}
          .
        </>
      ),
      enlace: { href: "/admin/bitacora", etiqueta: "Ver" },
    },
    ] as (Alerta | false | null)[]
  ).filter((a): a is Alerta => Boolean(a));

  return (
    <>
      <Titular sobre={`Hola${alumnoActual.nombre ? `, ${alumnoActual.nombre.split(" ")[0]}` : ""}`} titulo="Tablero">
        <Link href="/admin/mas" aria-label="Más">
          <Avatar nombre={alumnoActual.nombre} tono="oro" />
        </Link>
      </Titular>

      {laActividadAbierta ? (
        <div className="flex flex-col gap-3 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 px-4 py-3.5 text-white shadow-[0_8px_22px_rgb(28_114_165_/_0.32)]">
          <div className="flex items-center gap-2.5">
            <span aria-hidden className="size-2.5 rounded-full bg-[#7ee2b8] [animation:pulso_1.8s_infinite]" />
            <p className="text-xs font-bold uppercase tracking-wider">Marcaje abierto ahora</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold leading-snug">{laActividadAbierta.nombre}</p>
              <p className="text-[13px] text-white/80">
                {laActividadAbierta.lugar && <>{laActividadAbierta.lugar} · </>}cierra{" "}
                {horaEnGuatemala(laActividadAbierta.marcajeCierraEn)}
              </p>
            </div>
            <div className="text-right leading-none">
              <b className="text-4xl font-extrabold tabular-nums">{laActividadAbierta.asistencias}</b>
              <p className="mt-1 text-[11px] text-white/80">
                {laActividadAbierta.asistencias === 1 ? "asistencia" : "asistencias"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Link
              href={`/admin/actividades/${laActividadAbierta.id}/en-vivo`}
              className={clasesDeBoton("secundario", "!bg-white !text-primary-800 !shadow-none")}
            >
              <Icono nombre="vivo" />
              Ver en vivo
            </Link>
            {laActividadAbierta.claveKiosco ? (
              <a
                href={`/kiosco/${laActividadAbierta.claveKiosco}`}
                target="_blank"
                rel="noopener"
                className={clasesDeBoton("secundario", "!bg-white !text-primary-800 !shadow-none")}
              >
                <Icono nombre="pantalla" />
                Kiosco
              </a>
            ) : (
              <Link
                href={`/admin/actividades/${laActividadAbierta.id}/en-vivo`}
                className={clasesDeBoton("secundario", "!bg-white/15 !text-white !shadow-none")}
              >
                <Icono nombre="pantalla" />
                Crear kiosco
              </Link>
            )}
          </div>
        </div>
      ) : (
        <Tarjeta className="flex items-center gap-3">
          <Icono nombre="reloj" className="text-neutral-400" />
          <div>
            <p className="font-bold leading-snug">No hay marcaje abierto</p>
            <p className="text-[13px] text-neutral-500">
              Cuando una actividad publicada entre en horario aparece acá.
            </p>
          </div>
        </Tarjeta>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        <Dato numero={asistenciasHoy} texto="asistencias hoy" />
        <Dato numero={totalAlumnos} texto="alumnos registrados" />
        <Dato numero={publicadas} texto="actividades publicadas" />
        <Dato numero={clasesSinCatedratico} texto="clases sin catedrático" dorado={clasesSinCatedratico > 0} />
      </div>

      {alertas.length > 0 && (
        <>
          <TituloSeccion>Para revisar</TituloSeccion>
          <div className="flex flex-col gap-2.5">
            {alertas.map((alerta, indice) => (
              <div
                key={indice}
                className="flex items-center gap-3 rounded-2xl border border-accent-100 bg-accent-50 px-4 py-3.5 text-[13.5px] text-accent-700"
              >
                <Icono nombre={alerta.icono} />
                <p className="min-w-0 flex-1">{alerta.texto}</p>
                {alerta.enlace && (
                  <Link href={alerta.enlace.href} className="shrink-0 font-bold">
                    {alerta.enlace.etiqueta}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <Tarjeta className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Icono nombre="bajar" />
          <div>
            <p className="font-bold leading-snug">Reporte global</p>
            <p className="text-[13px] text-neutral-500">
              Todas las clases con catedrático asignado, en un solo libro de Excel.
              {clasesSinCatedratico > 0 && (
                <>
                  {" "}
                  No incluye {clasesSinCatedratico}{" "}
                  {clasesSinCatedratico === 1 ? "clase sin catedrático" : "clases sin catedrático"}.
                </>
              )}
            </p>
          </div>
        </div>
        <a href="/api/reportes/global" className={clasesDeBoton("secundario")}>
          Descargar reporte global
        </a>
      </Tarjeta>
    </>
  );
}

function Dato({ numero, texto, dorado }: { numero: number; texto: string; dorado?: boolean }) {
  return (
    <div className="rounded-[14px] bg-white p-3 shadow-tarjeta">
      <b className={`block text-[22px] font-extrabold tabular-nums tracking-tight ${dorado ? "text-accent-700" : ""}`}>
        {numero}
      </b>
      <span className="text-[11.5px] font-medium text-neutral-500">{texto}</span>
    </div>
  );
}
