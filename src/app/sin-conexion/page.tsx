export default function SinConexionPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-lg font-semibold text-neutral-900">No hay conexión</h1>
      <p className="text-sm text-neutral-600">
        El marcaje de asistencia necesita internet — nunca funciona sin conexión. Intentá de
        nuevo cuando la recuperes.
      </p>
    </main>
  );
}
