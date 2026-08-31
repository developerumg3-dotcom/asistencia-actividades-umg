import Link from "next/link";
import { enGuatemala } from "@/lib/fechas";
import { marcajeAbierto, obtenerActividadesDelAlumno } from "@/lib/actividades";
import { requireAlumno } from "@/lib/sesion";

export const dynamic = "force-dynamic";

/**
 * A5 — Inicio del alumno.
 *
 * Lo primero que ve al entrar. No hay lector de QR dentro de la app y no lo va a haber
 * (decision 10): el escaneo lo hace la camara nativa del telefono. Asi que esta pantalla no
 * es un lector, es la respuesta a "que tengo que hacer ahora".
 */
export default async function InicioPage() {
  const alumnoActual = await requireAlumno();
  const actividades = await obtenerActividadesDelAlumno(alumnoActual.id);
  const ahora = new Date();

  const abiertas = actividades.filter((a) => marcajeAbierto(a, ahora));
  const proxima = actividades.find((a) => a.marcajeAbreEn > ahora);
  const marcadas = actividades.filter((a) => a.marcadaEn).length;

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">
          Hola{alumnoActual.nombre ? `, ${alumnoActual.nombre.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          {marcadas === 0
            ? "Todavía no marcaste ninguna actividad."
            : `Llevás ${marcadas} ${marcadas === 1 ? "actividad marcada" : "actividades marcadas"}.`}
        </p>
      </div>

      {abiertas.length > 0 ? (
        abiertas.map((a) => (
          <section
            key={a.id}
            className={`rounded-md border p-5 ${
              a.marcadaEn ? "border-neutral-200 bg-white" : "border-primary-600 bg-primary-50"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">
              Abierta ahora
            </p>
            <h2 className="mt-1 text-lg font-semibold text-neutral-900">{a.nombre}</h2>
            <p className="mt-1 text-sm text-neutral-600">
              {a.lugar && <>{a.lugar} · </>}
              {a.puntos} {a.puntos === 1 ? "punto" : "puntos"}
            </p>

            {a.marcadaEn ? (
              <p className="mt-4 flex items-center gap-2 text-sm font-medium text-emerald-700">
                <span aria-hidden>✓</span> Ya marcaste, a las {enGuatemala(a.marcadaEn)}
              </p>
            ) : (
              <div className="mt-4 rounded-md bg-white p-4">
                <p className="text-sm font-medium text-neutral-900">
                  Apuntá la cámara de tu teléfono al QR de la pantalla.
                </p>
                <p className="mt-1 text-sm text-neutral-600">
                  Se abre esta app y pulsás el botón. El código cambia cada minuto, así que
                  hacelo en el momento.
                </p>
              </div>
            )}
          </section>
        ))
      ) : proxima ? (
        <section className="rounded-md border border-neutral-200 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Próxima actividad
          </p>
          <h2 className="mt-1 text-lg font-semibold text-neutral-900">{proxima.nombre}</h2>
          <p className="mt-1 text-sm text-neutral-600">
            {enGuatemala(proxima.iniciaEn)}
            {proxima.lugar && <> · {proxima.lugar}</>}
          </p>
        </section>
      ) : (
        <section className="rounded-md border border-dashed border-neutral-300 p-8 text-center">
          <p className="text-sm font-medium text-neutral-700">No hay actividades abiertas.</p>
          <p className="mt-1 text-sm text-neutral-500">
            Cuando haya una, te aparece acá con las instrucciones.
          </p>
        </section>
      )}

      <div className="flex flex-col gap-1">
        <Link href="/clases" className="text-sm text-primary-700 underline hover:text-primary-800">
          Mis cursos
        </Link>
        <Link
          href="/ayuda/instalar-ios"
          className="text-sm text-neutral-600 underline hover:text-primary-700"
        >
          ¿Cómo instalo esta app en mi iPhone?
        </Link>
      </div>
    </main>
  );
}
