import { and, count, eq, gte, lte } from "drizzle-orm";
import Link from "next/link";
import type { ReactNode } from "react";
import { db } from "@/db/cliente";
import { actividad, alumno, asistencia } from "@/db/esquema";
import { detectarSenales } from "@/lib/bitacora/senales";
import { listarBitacora } from "@/lib/bitacora/consulta";
import { contarClasesSinCatedratico } from "@/lib/clases";
import { enGuatemala, inicioDeHoyEnGuatemala } from "@/lib/fechas";
import { avisoEsUrgente } from "@/lib/puntos/calculo";
import { contarAlumnosConSaldoPendiente, fechaDeCorteVigente } from "@/lib/puntos/consulta";

// Numeros que cambian con cada marcaje: igual criterio que B6, no tiene sentido cachear esto.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const VENTANA_ALERTA_FALLOS_MIN = 60;

async function actividadConMarcajeAbierto() {
  const ahora = new Date();
  const [fila] = await db
    .select({ id: actividad.id, nombre: actividad.nombre, marcajeCierraEn: actividad.marcajeCierraEn })
    .from(actividad)
    .where(and(eq(actividad.estado, "publicada"), lte(actividad.marcajeAbreEn, ahora), gte(actividad.marcajeCierraEn, ahora)))
    .limit(1);
  return fila ?? null;
}

/** B1 — panorama general: numeros del dia y alertas para decidir, nunca acciones automaticas. */
export default async function TableroAdminPage() {
  const ahora = new Date();
  const desdeHoy = inicioDeHoyEnGuatemala(ahora);
  const desdeAlertaFallos = new Date(ahora.getTime() - VENTANA_ALERTA_FALLOS_MIN * 60_000);

  const [
    laActividadAbierta,
    [{ total: asistenciasHoy }],
    [{ total: totalAlumnos }],
    clasesSinCatedratico,
    saldoPendiente,
    fechaDeCorte,
    eventosRecientes,
  ] = await Promise.all([
    actividadConMarcajeAbierto(),
    db.select({ total: count() }).from(asistencia).where(gte(asistencia.marcadaEn, desdeHoy)),
    db.select({ total: count() }).from(alumno),
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

  type Alerta = { texto: ReactNode; enlace?: { href: string; etiqueta: string } };

  const alertas: Alerta[] = (
    [
      clasesSinCatedratico > 0 && {
      texto: (
        <>
          <strong className="font-semibold">{clasesSinCatedratico}</strong>{" "}
          {clasesSinCatedratico === 1 ? "clase no tiene" : "clases no tienen"} catedrático asignado y no se
          pueden exportar.
        </>
      ),
      enlace: { href: "/admin/clases", etiqueta: "Ver clases" },
    },
    saldoPendiente > 0 &&
      fechaDeCorte && {
        texto: (
          <>
            <strong className="font-semibold">{saldoPendiente}</strong>{" "}
            {saldoPendiente === 1 ? "alumno tiene" : "alumnos tienen"} saldo de puntos extra sin repartir
            {corteEsUrgente ? ", y el corte es en menos de 24 horas" : ""} — corte el {enGuatemala(fechaDeCorte)}.
          </>
        ),
      },
    (alumnosConFallos > 0 || dispositivosCompartidos > 0) && {
      texto: (
        <>
          Actividad reciente en la bitácora que conviene revisar: {alumnosConFallos > 0 && (
            <>
              <strong className="font-semibold">{alumnosConFallos}</strong>{" "}
              {alumnosConFallos === 1 ? "alumno con" : "alumnos con"} varios intentos fallidos seguidos
            </>
          )}
          {alumnosConFallos > 0 && dispositivosCompartidos > 0 && " · "}
          {dispositivosCompartidos > 0 && (
            <>
              <strong className="font-semibold">{dispositivosCompartidos}</strong>{" "}
              {dispositivosCompartidos === 1 ? "dispositivo detrás de varios alumnos" : "dispositivos detrás de varios alumnos"}
            </>
          )}
          .
        </>
      ),
      enlace: { href: "/admin/bitacora", etiqueta: "Ver bitácora" },
    },
    ] as (Alerta | false | null)[]
  ).filter((a): a is Alerta => Boolean(a));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Tablero</h1>
        <p className="mt-1 text-sm text-neutral-600">Panorama general de hoy.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-neutral-200 bg-white p-4">
          <p className="text-sm text-neutral-600">Marcaje abierto ahora</p>
          {laActividadAbierta ? (
            <>
              <p className="mt-1 truncate text-lg font-semibold text-neutral-900">{laActividadAbierta.nombre}</p>
              <Link
                href={`/admin/actividades/${laActividadAbierta.id}/en-vivo`}
                className="text-sm text-primary-700 underline"
              >
                Ver en vivo
              </Link>
            </>
          ) : (
            <p className="mt-1 text-lg font-semibold text-neutral-400">Ninguna</p>
          )}
        </div>
        <div className="rounded-md border border-neutral-200 bg-white p-4">
          <p className="text-sm text-neutral-600">Asistencias hoy</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-neutral-900">{asistenciasHoy}</p>
        </div>
        <div className="rounded-md border border-neutral-200 bg-white p-4">
          <p className="text-sm text-neutral-600">Alumnos registrados</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-neutral-900">{totalAlumnos}</p>
        </div>
      </div>

      {alertas.length > 0 && (
        <div className="flex flex-col gap-2">
          {alertas.map((alerta, indice) => (
            <div
              key={indice}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-accent-300 bg-accent-50 px-4 py-3 text-sm text-accent-900"
            >
              <p>{alerta.texto}</p>
              {alerta.enlace && (
                <Link href={alerta.enlace.href} className="shrink-0 font-medium underline">
                  {alerta.enlace.etiqueta}
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="rounded-md border border-neutral-200 bg-white p-4">
        <h2 className="font-medium text-neutral-900">Reporte global</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Todas las clases con catedrático asignado, en un solo libro.
          {clasesSinCatedratico > 0 && (
            <>
              {" "}
              No incluye {clasesSinCatedratico} {clasesSinCatedratico === 1 ? "clase sin catedrático" : "clases sin catedrático"}.
            </>
          )}
        </p>
        <a
          href="/api/reportes/global"
          className="mt-3 inline-block rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Descargar reporte global
        </a>
      </div>
    </div>
  );
}
