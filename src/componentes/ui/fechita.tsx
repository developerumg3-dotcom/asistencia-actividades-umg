import { diaYMesEnGuatemala } from "@/lib/fechas";

type Tono = "normal" | "viva" | "apagada";

const clasesPorTono: Record<Tono, string> = {
  normal: "bg-primary-50 text-primary-700",
  viva: "bg-primary-600 text-white",
  apagada: "bg-neutral-100 text-neutral-400",
};

/** Bloque de dia y mes al lado de una actividad. Solo en componentes de servidor. */
export function Fechita({ fecha, tono = "normal" }: { fecha: Date; tono?: Tono }) {
  const { dia, mes } = diaYMesEnGuatemala(fecha);
  return (
    <div
      className={`flex h-[54px] w-[50px] shrink-0 flex-col items-center justify-center rounded-[13px] leading-none ${clasesPorTono[tono]}`}
    >
      <b className="text-xl font-extrabold tabular-nums">{dia}</b>
      <span className="mt-1 text-[11px] font-bold uppercase">{mes}</span>
    </div>
  );
}
