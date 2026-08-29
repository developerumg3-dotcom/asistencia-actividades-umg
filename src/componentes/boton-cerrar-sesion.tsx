import { cerrarSesion } from "@/lib/auth/acciones";

export function BotonCerrarSesion() {
  return (
    <form action={cerrarSesion}>
      <button type="submit" className="text-sm text-neutral-600 underline">
        Cerrar sesión
      </button>
    </form>
  );
}
