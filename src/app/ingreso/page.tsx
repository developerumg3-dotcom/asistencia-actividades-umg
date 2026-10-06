import Link from "next/link";
import { FormularioIngreso } from "@/componentes/formulario-ingreso";
import { Marca, PantallaDeEntrada } from "@/componentes/ui/marca";
import { Tarjeta } from "@/componentes/ui/tarjeta";

export default function IngresoPage() {
  return (
    <PantallaDeEntrada>
      <Marca titulo="Actividades UMG" bajada="Tus puntos por participar en las actividades de la universidad" />
      <Tarjeta className="flex flex-col gap-3">
        <FormularioIngreso />
        <Link href="/auth/forgot-password" className="text-center text-sm font-semibold text-primary-700">
          ¿Olvidaste tu contraseña?
        </Link>
      </Tarjeta>
      <p className="text-center text-sm text-neutral-500">
        ¿No tenés cuenta?{" "}
        <Link href="/registro" className="font-semibold text-primary-700">
          Registrate
        </Link>
      </p>
    </PantallaDeEntrada>
  );
}
