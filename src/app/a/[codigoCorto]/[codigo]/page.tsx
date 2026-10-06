import Image from "next/image";
import Link from "next/link";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/cliente";
import { actividad } from "@/db/esquema";
import { BotonMarcar } from "@/componentes/boton-marcar";
import { FormularioIngreso } from "@/componentes/formulario-ingreso";
import { Avatar } from "@/componentes/ui/avatar";
import { EnlaceBoton } from "@/componentes/ui/boton";
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
    .select({ nombre: actividad.nombre, lugar: actividad.lugar, puntos: actividad.puntos, tipo: actividad.tipo })
    .from(actividad)
    // Un codigo conocido no hace publico un borrador. La validez temporal del QR
    // sigue comprobándose al pulsar Marcar, no al renderizar esta pagina.
    .where(and(eq(actividad.codigoCorto, codigoCorto), inArray(actividad.estado, ["publicada", "cerrada"])))
    .limit(1);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-5 px-5 py-8">
      <div className="text-center">
        <Image src="/escudo-umg.webp" alt="" width={76} height={76} className="mx-auto" priority />
        {laActividad ? (
          <>
            <p className="mt-3.5 text-xs font-bold uppercase tracking-widest text-neutral-400">
              Vas a marcar asistencia en
            </p>
            <h1 className="mt-1 text-[26px] font-extrabold leading-tight tracking-tight">{laActividad.nombre}</h1>
            <p className="mt-1.5 text-sm text-neutral-500">
              {laActividad.lugar && <>{laActividad.lugar} · </>}
              {laActividad.puntos} {laActividad.puntos === 1 ? "punto" : "puntos"}
            </p>
          </>
        ) : (
          <h1 className="mt-3.5 text-[24px] font-extrabold leading-tight tracking-tight">Actividad no encontrada</h1>
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
            <h2 className="font-bold">Iniciá sesión para marcar</h2>
            <p className="mt-1 text-sm text-neutral-500">
              No te vas a mover de acá. Si el código se vence mientras entrás, escaneá otra vez.
            </p>
          </div>
          {/* El destino es esta misma URL: el codigo no se pierde por pasar por el login. */}
          <FormularioIngreso destino={`/a/${codigoCorto}/${codigo}`} />
          <p className="text-center text-sm text-neutral-500">
            ¿No tenés cuenta?{" "}
            <Link href="/registro" className="font-semibold text-primary-700">
              Registrate
            </Link>
          </p>
        </Tarjeta>
      ) : !alumnoActual.perfilCompleto ? (
        <Tarjeta className="flex flex-col gap-3 text-center">
          <p className="text-sm text-neutral-700">Completá tu carné y nombre para registrar tu asistencia.</p>
          <EnlaceBoton href="/perfil/completar" className="w-full">
            Completar mi perfil
          </EnlaceBoton>
        </Tarjeta>
      ) : (
        <>
          <Tarjeta className="flex items-center gap-3">
            <Avatar nombre={alumnoActual.nombre} tono="azul" />
            <div className="min-w-0">
              <p className="truncate font-bold leading-snug">{alumnoActual.nombre}</p>
              <p className="text-xs text-neutral-400">Carné {alumnoActual.carne}</p>
            </div>
          </Tarjeta>
          <BotonMarcar
            codigoCorto={codigoCorto}
            codigo={codigo}
            puntos={laActividad.puntos}
            esExtra={laActividad.tipo === "extra"}
          />
        </>
      )}
    </main>
  );
}
