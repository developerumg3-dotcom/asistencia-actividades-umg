import Link from "next/link";
import { ComoMarcar } from "@/componentes/como-marcar";
import { Fechita } from "@/componentes/ui/fechita";
import { Icono } from "@/componentes/ui/icono";
import { enGuatemala, horaEnGuatemala, relativoEnGuatemala } from "@/lib/fechas";
import {
  asistenciaCompleta,
  faseAbierta,
  lePuedeTocarMarcar,
  marcajeAbierto,
  type ActividadDelAlumno,
} from "@/lib/actividades";

/**
 * Lo que hay que hacer ahora mismo, arriba de los puntos: si hay marcaje abierto, como
 * marcar; si ya marco, la confirmacion; si no hay nada abierto, la proxima actividad.
 * Sin actividades no muestra nada: los puntos siguen siendo los protagonistas de la pantalla.
 *
 * Con doble marcaje (PLANIFICACION.md §6.5) hay un estado mas: entrada marcada y salida
 * pendiente, en el que el punto todavia no esta y hay que decirlo claro.
 */
export function AvisoActividadAbierta({ actividades }: { actividades: ActividadDelAlumno[] }) {
  const ahora = new Date();
  const abierta = actividades.find((a) => marcajeAbierto(a, ahora));
  const proxima = actividades.find((a) => a.estado === "publicada" && a.marcajeAbreEn > ahora);

  // Entrada marcada, salida todavia sin abrir (el hueco entre las dos): no hay nada que
  // pulsar, pero tampoco hay que dejar al alumno creyendo que ya tiene el punto.
  const esperandoSalida = actividades.find(
    (a) =>
      a.estado === "publicada" &&
      a.dobleMarcaje &&
      a.marcadaEn &&
      !a.salidaEn &&
      a.salidaAbreEn &&
      a.salidaCierraEn &&
      ahora < a.salidaAbreEn,
  );
  if (esperandoSalida && !abierta) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-accent-50 px-4 py-3.5 text-accent-900">
        <Icono nombre="ok" />
        <div className="min-w-0">
          <p className="font-bold leading-snug">Entrada marcada en {esperandoSalida.nombre}</p>
          <p className="text-[13px] opacity-80">
            Falta la salida, de {horaEnGuatemala(esperandoSalida.salidaAbreEn!)} a{" "}
            {horaEnGuatemala(esperandoSalida.salidaCierraEn!)}. Sin ella no suma el punto.
          </p>
        </div>
      </div>
    );
  }

  if (abierta && asistenciaCompleta(abierta)) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3.5 text-emerald-800">
        <Icono nombre="ok" />
        <div className="min-w-0">
          <p className="font-bold leading-snug">Ya marcaste {abierta.nombre}</p>
          <p className="text-[13px] opacity-80">
            {abierta.dobleMarcaje
              ? "Marcaste entrada y salida y tu punto ya está sumado"
              : `Marcaste a las ${horaEnGuatemala(abierta.marcadaEn!)} y tu punto ya está sumado`}
          </p>
        </div>
      </div>
    );
  }

  // Abierta la entrada y ya marcada: no hay nada que hacer hasta que abra la salida.
  if (abierta && !lePuedeTocarMarcar(abierta, ahora)) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3.5 text-emerald-800">
        <Icono nombre="ok" />
        <div className="min-w-0">
          <p className="font-bold leading-snug">Entrada marcada en {abierta.nombre}</p>
          <p className="text-[13px] opacity-80">
            Marcaste a las {horaEnGuatemala(abierta.marcadaEn!)}. Para sumar el punto, marcá también la salida
            {abierta.salidaAbreEn && <> de {horaEnGuatemala(abierta.salidaAbreEn)}</>}
            {abierta.salidaCierraEn && <> a {horaEnGuatemala(abierta.salidaCierraEn)}</>}.
          </p>
        </div>
      </div>
    );
  }

  if (abierta) {
    const fase = faseAbierta(abierta, ahora);
    const cierre =
      fase === "salida" && abierta.salidaCierraEn ? abierta.salidaCierraEn : abierta.marcajeCierraEn;
    return (
      <div className="flex flex-col gap-3 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 px-4 py-3.5 text-white shadow-[0_8px_22px_rgb(28_114_165_/_0.32)]">
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="size-2.5 rounded-full bg-[#7ee2b8] [animation:pulso_1.8s_infinite]" />
          <p className="text-xs font-bold uppercase tracking-wider">
            {fase === "salida"
              ? "Marcá tu salida ahora"
              : abierta.dobleMarcaje
                ? "Entrada abierta ahora"
                : "Marcaje abierto ahora"}
          </p>
        </div>
        <div>
          <p className="text-lg font-bold leading-snug">{abierta.nombre}</p>
          <p className="text-[13px] text-white/80">
            {abierta.lugar && <>{abierta.lugar} · </>}cierra {horaEnGuatemala(cierre)} · {abierta.puntos}{" "}
            {abierta.puntos === 1 ? "punto" : "puntos"}
          </p>
          {abierta.dobleMarcaje && (
            <p className="mt-1 text-[12.5px] text-white/80">
              Doble marcaje: sin entrada y salida no suma el punto.
            </p>
          )}
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
