import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db/cliente";
import { actividad, alumno, asistencia } from "@/db/esquema";
import { FormularioMarcajeManual } from "@/componentes/formulario-marcaje-manual";
import { enGuatemala, horaEnGuatemala } from "@/lib/fechas";
import { requireAdmin } from "@/lib/sesion";

// Se recarga sola: durante el evento interesa el numero de ahora, no el de hace un minuto.
export const dynamic = "force-dynamic";
export const revalidate = 0;

/** B6 — quien va marcando, durante la actividad. */
export default async function EnVivoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const [laActividad] = await db
    .select({
      nombre: actividad.nombre,
      lugar: actividad.lugar,
      estado: actividad.estado,
      marcajeAbreEn: actividad.marcajeAbreEn,
      marcajeCierraEn: actividad.marcajeCierraEn,
      radioM: actividad.radioM,
    })
    .from(actividad)
    .where(eq(actividad.id, id))
    .limit(1);

  if (!laActividad) notFound();

  const marcajes = await db
    .select({
      id: asistencia.id,
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
    .orderBy(desc(asistencia.marcadaEn));

  const ahora = new Date();
  const abierto = ahora >= laActividad.marcajeAbreEn && ahora <= laActividad.marcajeCierraEn;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/actividades" className="text-sm text-primary-700 underline">
          ← Actividades
        </Link>
        <h1 className="mt-2 text-xl font-semibold">{laActividad.nombre}</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Marcaje {abierto ? "abierto" : "cerrado"} · hasta{" "}
          {enGuatemala(laActividad.marcajeCierraEn)}
        </p>
      </div>

      <div className="flex items-baseline gap-3 rounded-md border border-primary-200 bg-primary-50 px-4 py-3">
        <span className="text-4xl font-semibold tabular-nums text-primary-800">
          {marcajes.length}
        </span>
        <span className="text-sm text-primary-800">
          {marcajes.length === 1 ? "asistencia registrada" : "asistencias registradas"}
        </span>
      </div>

      {laActividad.radioM !== null && marcajes.length > 0 && (
        <p className="text-sm text-neutral-600">
          Zona declarada de {laActividad.radioM} m ·{" "}
          {marcajes.filter((m) => m.distanciaM === null).length} sin ubicación ·{" "}
          {
            marcajes.filter(
              (m) => m.distanciaM !== null && m.distanciaM - (m.precisionM ?? 0) > laActividad.radioM!,
            ).length
          }{" "}
          fuera del radio. <strong className="font-medium">Solo se registra</strong>, no bloquea.
        </p>
      )}

      {marcajes.length === 0 ? (
        <div className="rounded-md border border-dashed border-neutral-300 px-4 py-12 text-center">
          <p className="text-sm font-medium text-neutral-700">Todavía no marcó nadie.</p>
          <p className="mt-1 text-sm text-neutral-500">
            Recargá la página para ver los que vayan entrando.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
                <th className="py-2 pr-4 font-medium">Hora</th>
                <th className="py-2 pr-4 font-medium">Alumno</th>
                <th className="py-2 pr-4 font-medium">Carné</th>
                {laActividad.radioM !== null && (
                  <th className="py-2 pr-4 font-medium">Distancia</th>
                )}
                <th className="py-2 font-medium">Origen</th>
              </tr>
            </thead>
            <tbody>
              {marcajes.map((m) => (
                <tr key={m.id} className="border-b border-neutral-100">
                  <td className="py-2 pr-4 tabular-nums text-neutral-600">
                    {horaEnGuatemala(m.marcadaEn)}
                  </td>
                  <td className="py-2 pr-4 font-medium text-neutral-900">
                    {m.nombre ?? m.email}
                  </td>
                  <td className="py-2 pr-4 font-mono text-neutral-600">{m.carne ?? "—"}</td>
                  {laActividad.radioM !== null && (
                    <td className="py-2 pr-4 tabular-nums">
                      {m.distanciaM === null ? (
                        // Nego el permiso o el telefono no dio posicion. No es sospechoso:
                        // en la etapa 1 la ubicacion es opcional.
                        <span className="text-neutral-400">Sin ubicación</span>
                      ) : m.distanciaM - (m.precisionM ?? 0) > laActividad.radioM ? (
                        <span
                          className="font-medium text-accent-800"
                          title={m.precisionM ? `Precisión ±${m.precisionM} m` : undefined}
                        >
                          {m.distanciaM} m · fuera
                        </span>
                      ) : (
                        <span
                          className="text-neutral-600"
                          title={m.precisionM ? `Precisión ±${m.precisionM} m` : undefined}
                        >
                          {m.distanciaM} m
                        </span>
                      )}
                    </td>
                  )}
                  <td className="py-2 text-neutral-500">
                    {m.origen === "manual" ? (
                      <span title={m.notaManual ?? undefined}>Manual</span>
                    ) : (
                      "QR"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <FormularioMarcajeManual actividadId={id} />
    </div>
  );
}
