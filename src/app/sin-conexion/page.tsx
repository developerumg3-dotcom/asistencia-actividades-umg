import { Icono } from "@/componentes/ui/icono";

export default function SinConexionPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="grid size-16 place-items-center rounded-full bg-white text-neutral-400 shadow-tarjeta">
        <Icono nombre="vivo" className="size-8" />
      </span>
      <h1 className="text-[22px] font-extrabold tracking-tight">No hay conexión</h1>
      <p className="text-sm text-neutral-500">
        El marcaje de asistencia necesita internet: nunca funciona sin conexión. Intentá de nuevo cuando
        la recuperes.
      </p>
    </main>
  );
}
