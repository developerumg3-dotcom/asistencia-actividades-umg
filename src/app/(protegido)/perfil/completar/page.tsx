import Image from "next/image";
import { FormularioPerfil } from "@/componentes/formulario-perfil";
import { Tarjeta } from "@/componentes/ui/tarjeta";
import { obtenerClasesDisponibles, obtenerIdsInscritoDe } from "@/lib/clases";
import { requireAlumno } from "@/lib/sesion";

export default async function CompletarPerfilPage() {
  const alumnoActual = await requireAlumno();

  const [cursosDisponibles, idsInscritoInicial] = await Promise.all([
    obtenerClasesDisponibles(),
    obtenerIdsInscritoDe(alumnoActual.id),
  ]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <Image src="/escudo-umg.webp" alt="Escudo de la Universidad Mariano Gálvez" width={56} height={56} />
        <div>
          <h1 className="text-xl font-semibold">Completá tu perfil</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Necesitamos tu carné, tu nombre completo y tu ciclo para acreditarte los puntos, y
            los cursos en donde estás para saber dónde marcarte la asistencia.
          </p>
        </div>
      </div>
      <Tarjeta>
        <FormularioPerfil
          carneActual={alumnoActual.carne}
          nombreActual={alumnoActual.nombre}
          cicloActual={alumnoActual.ciclo}
          cursosDisponibles={cursosDisponibles}
          idsInscritoInicial={idsInscritoInicial}
        />
      </Tarjeta>
    </main>
  );
}
