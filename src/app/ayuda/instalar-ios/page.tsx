import { SubBarra } from "@/componentes/ui/titular";

export const metadata = {
  title: "Instalar en iPhone — Actividades UMG",
};

const pasos = [
  {
    titulo: "Abrí esta página en Safari",
    detalle:
      "Tiene que ser Safari, no Chrome ni otro navegador — es el único que en iPhone puede agregar la app a la pantalla de inicio.",
  },
  {
    titulo: "Tocá el botón Compartir",
    detalle: "El ícono del cuadrado con la flecha hacia arriba, en la barra de abajo (o de arriba, según el modelo).",
  },
  {
    titulo: "Elegí \"Agregar a inicio\"",
    detalle: "Puede que tengas que deslizar la lista de opciones hacia abajo para encontrarla.",
  },
  {
    titulo: "Confirmá tocando \"Agregar\"",
    detalle: "El ícono de Actividades UMG va a aparecer en tu pantalla de inicio, como cualquier otra app.",
  },
];

export default function InstalarIOSPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 pb-10 pt-5">
      <SubBarra titulo="Instalar en tu iPhone" volverA="/cuenta" />
      <p className="text-sm text-neutral-500">
        iOS no ofrece instalar la app solo: hay que agregarla a mano desde Safari. Son cuatro pasos.
      </p>

      <ol className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-tarjeta">
        {pasos.map((paso, indice) => (
          <li key={paso.titulo} className="flex items-start gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-600 text-sm font-bold text-white">
              {indice + 1}
            </span>
            <div>
              <p className="font-bold leading-snug">{paso.titulo}</p>
              <p className="mt-0.5 text-[13px] text-neutral-500">{paso.detalle}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="text-[13px] text-neutral-500">
        Una vez instalada, abrí siempre la app desde su ícono: así se abre sin la barra de Safari. En
        Android, Chrome te ofrece instalarla solo. Marcar asistencia siempre necesita conexión a internet,
        instalada o no.
      </p>
    </main>
  );
}
