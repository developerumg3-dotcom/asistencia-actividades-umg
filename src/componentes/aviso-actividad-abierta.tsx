import Link from "next/link";
import { ComoMarcar } from "@/componentes/como-marcar";
import { Fechita } from "@/componentes/ui/fechita";
import { Icono } from "@/componentes/ui/icono";
import { enGuatemala, horaEnGuatemala, relativoEnGuatemala } from "@/lib/fechas";
import { marcajeAbierto, type ActividadDelAlumno } from "@/lib/actividades";

/**
 * Lo que hay que hacer ahora mismo, arriba de los puntos: si hay marcaje abierto, como
 * marcar; si ya marco, la confirmacion; si no hay nada abierto, la proxima actividad.
 * Sin actividades no muestra nada: los puntos siguen siendo los protagonistas de la pantalla.
 */
export function AvisoActividadAbierta({ actividades }: { actividades: ActividadDelAlumno[] }) {
  const ahora = new Date();
  const abierta = actividades.find((a) => marcajeAbierto(a, ahora));
  const proxima = actividades.find((a) => a.estado === "publicada" && a.marcajeAbreEn > ahora);

  if (abierta?.marcadaEn) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3.5 text-emerald-800">
        <Icono nombre="ok" />
        <div className="min-w-0">
          <p className="font-bold leading-snug">Ya marcaste {abierta.nombre}</p>
          <p className="text-[13px] opacity-80">
            Marcaste a las {horaEnGuatemala(abierta.marcadaEn)} y tu punto ya está sumado
          </p>
        </div>
      </div>
    );
  }

  if (abierta) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 px-4 py-3.5 text-white shadow-[0_8px_22px_rgb(28_114_165_/_0.32)]">
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="size-2.5 rounded-full bg-[#7ee2b8] [animation:pulso_1.8s_infinite]" />
          <p className="text-xs font-bold uppercase tracking-wider">Marcaje abierto ahora</p>
        </div>
        <div>
          <p className="text-lg font-bold leading-snug">{abierta.nombre}</p>
          <p className="text-[13px] text-white/80">
            {abierta.lugar && <>{abierta.lugar} · </>}cierra {horaEnGuatemala(abierta.marcajeCierraEn)} ·{" "}
            {abierta.puntos} {abierta.puntos === 1 ? "punto" : "puntos"}
          </p>
        </div>
        <ComoMarcar className="!bg-white !text-primary-800 !shadow-none" />
      </div>
    );
  }

  if (proxima) {
    return (
      <Link href="/actividades" className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5 shadow-tarjeta">
        <Fechita fecha={proxima.iniciaEn} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-neutral-400">
            Próxima actividad · {relativoEnGuatemala(proxima.iniciaEn, ahora)}
          </p>
          <p className="font-bold leading-snug">{proxima.nombre}</p>
          <p className="text-[13px] text-neutral-500">
            {enGuatemala(proxima.iniciaEn)}
            {proxima.lugar && <> · {proxima.lugar}</>}
          </p>
        </div>
        <Icono nombre="der" className="text-neutral-400" />
      </Link>
    );
  }

  return null;
}
