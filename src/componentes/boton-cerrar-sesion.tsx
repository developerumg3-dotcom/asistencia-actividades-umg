import { cerrarSesion } from "@/lib/auth/acciones";
import { Boton } from "@/componentes/ui/boton";

export function BotonCerrarSesion() {
  return (
    <form action={cerrarSesion}>
      <Boton type="submit" variante="enlace">
        Cerrar sesión
      </Boton>
    </form>
  );
}
