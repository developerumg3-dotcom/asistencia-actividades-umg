import Image from "next/image";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db/cliente";
import { actividad } from "@/db/esquema";
import { BotonMarcar } from "@/componentes/boton-marcar";
import { FormularioIngreso } from "@/componentes/formulario-ingreso";
import { Tarjeta } from "@/componentes/ui/tarjeta";
import { obtenerAlumnoActual } from "@/lib/sesion";

export const dynamic = "force-dynamic";

/**
 * A6 — la pantalla a la que llega el QR.
 *
 * Reglas de §6.4, que salen de que en iOS el enlace abre en Safari sin la sesion de la PWA:
 *
 * - Si no hay sesion, el formulario de ingreso va **en esta misma pagina**, no una
 *   redireccion que pierda el codigo.
 * - Tras entrar, se vuelve a esta misma URL.
 * - El resultado se muestra sin navegar (A7, en `BotonMarcar`).
 *
 * El codigo NO se valida al cargar la pagina: se valida cuando llega el boton. Cargar la
 * pagina y pulsar son dos momentos distintos, y el que cuenta es el segundo.
 */
export default async function MarcarPage({
  params,
}: {
  params: Promise<{ codigoCorto: string; codigo: string }>;
}) {
  const { codigoCorto, codigo } = await params;
  const alumnoActual = await obtenerAlumnoActual();

  const [laActividad] = await db
    .select({ nombre: actividad.nombre, lugar: actividad.lugar, puntos: actividad.puntos })
    .from(actividad)
    .where(eq(actividad.codigoCorto, codigoCorto))
    .limit(1);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 p-6">
      <div className="text-center">
        <Image src="/escudo-umg.webp" alt="" width={48} height={48} className="mx-auto" />
        <h1 className="mt-3 text-xl font-semibold">
          {laActividad ? laActividad.nombre : "Actividad no encontrada"}
        </h1>
        {laActividad && (
          <p className="mt-1 text-sm text-neutral-600">
            {laActividad.lugar && <>{laActividad.lugar} · </>}
            {laActividad.puntos} {laActividad.puntos === 1 ? "punto" : "puntos"}
          </p>
        )}
      </div>

      {!laActividad ? (
        <Tarjeta className="text-center">
          <p className="text-sm text-neutral-600">
            Ese código no corresponde a ninguna actividad. Volvé a escanear el QR de la pantalla.
          </p>
        </Tarjeta>
      ) : !alumnoActual ? (
        <Tarjeta className="flex flex-col gap-4">
          <div>
            <h2 className="font-medium">Iniciá sesión para marcar</h2>
            <p className="mt-1 text-sm text-neutral-600">
              No te vas a mover de acá. Si el código se vence mientras entrás, escaneá otra vez.
            </p>
          </div>
          {/* El destino es esta misma URL: el codigo no se pierde por pasar por el login. */}
          <FormularioIngreso destino={`/a/${codigoCorto}/${codigo}`} />
          <p className="text-sm text-neutral-600">
            ¿No tenés cuenta?{" "}
            <Link href="/registro" className="underline hover:text-primary-700">
              Registrate
            </Link>
          </p>
        </Tarjeta>
      ) : !alumnoActual.perfilCompleto ? (
        <Tarjeta className="flex flex-col gap-3 text-center">
          <p className="text-sm text-neutral-700">
            Completá tu carné y nombre para registrar tu asistencia.
          </p>
          <Link
            href="/perfil/completar"
            className="text-sm font-medium text-primary-700 underline hover:text-primary-800"
          >
            Completar mi perfil
          </Link>
        </Tarjeta>
      ) : (
        <BotonMarcar codigoCorto={codigoCorto} codigo={codigo} />
      )}
    </main>
  );
}
