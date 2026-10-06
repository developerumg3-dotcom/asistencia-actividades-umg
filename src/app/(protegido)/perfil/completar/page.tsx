import { FormularioPerfil } from "@/componentes/formulario-perfil";
import { Marca, PantallaDeEntrada } from "@/componentes/ui/marca";
import { Tarjeta } from "@/componentes/ui/tarjeta";
import { cerrarSesion } from "@/lib/auth/acciones";
import { obtenerClasesDisponibles, obtenerIdsInscritoDe } from "@/lib/clases";
import { requireAlumno } from "@/lib/sesion";

export default async function CompletarPerfilPage() {
  const alumnoActual = await requireAlumno();

  const [cursosDisponibles, idsInscritoInicial] = await Promise.all([
    obtenerClasesDisponibles(),
    obtenerIdsInscritoDe(alumnoActual.id),
  ]);

  return (
    <PantallaDeEntrada>
      <Marca
        titulo="Completá tu perfil"
        bajada="Es un paso único. Sin tu carné no podemos acreditarte los puntos, y sin tus cursos no sabemos dónde sumarlos."
      />
      <Tarjeta>
        <FormularioPerfil
          carneActual={alumnoActual.carne}
          nombreActual={alumnoActual.nombre}
          cicloActual={alumnoActual.ciclo}
          cursosDisponibles={cursosDisponibles}
          idsInscritoInicial={idsInscritoInicial}
        />
      </Tarjeta>
      <form action={cerrarSesion} className="text-center">
        <button type="submit" className="text-sm font-semibold text-neutral-500">
          Cerrar sesión
        </button>
      </form>
    </PantallaDeEntrada>
  );
}
