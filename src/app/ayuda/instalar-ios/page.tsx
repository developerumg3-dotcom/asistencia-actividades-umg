import Link from "next/link";

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
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Instalar en tu iPhone</h1>
        <p className="mt-1 text-sm text-neutral-600">
          iOS no ofrece instalar la app solo — hay que agregarla a mano desde Safari. Son cuatro
          pasos.
        </p>
      </div>

      <ol className="flex flex-col gap-4">
        {pasos.map((paso, indice) => (
          <li key={paso.titulo} className="flex gap-4 rounded-md border border-neutral-200 p-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-semibold text-white">
              {indice + 1}
            </span>
            <div>
              <p className="text-sm font-medium text-neutral-900">{paso.titulo}</p>
              <p className="mt-1 text-sm text-neutral-600">{paso.detalle}</p>
            </div>
          </li>
        ))}
      </ol>

      <p className="text-sm text-neutral-600">
        Una vez instalada, abrí siempre la app desde su ícono — así se abre sin la barra de
        Safari. Recordá que marcar asistencia siempre necesita conexión a internet, instalada o
        no.
      </p>

      <Link href="/inicio" className="text-sm text-primary-700 underline hover:text-primary-800">
        Volver a inicio
      </Link>
    </main>
  );
}
