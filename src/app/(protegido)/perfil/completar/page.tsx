import { FormularioPerfil } from "@/componentes/formulario-perfil";
import { requireAlumno } from "@/lib/sesion";

export default async function CompletarPerfilPage() {
  const alumnoActual = await requireAlumno();

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Completá tu perfil</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Necesitamos tu carné y tu nombre completo para poder acreditarte los puntos.
        </p>
      </div>
      <FormularioPerfil carneActual={alumnoActual.carne} nombreActual={alumnoActual.nombre} />
    </main>
  );
}
