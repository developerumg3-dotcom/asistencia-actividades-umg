import Link from "next/link";
import { FormularioRegistro } from "@/componentes/formulario-registro";
import { Marca, PantallaDeEntrada } from "@/componentes/ui/marca";
import { Tarjeta } from "@/componentes/ui/tarjeta";

export default function RegistroPage() {
  return (
    <PantallaDeEntrada>
      <Marca
        titulo="Creá tu cuenta"
        bajada="Con tu correo y una contraseña. Después completás tu carné y tu nombre."
      />
      <Tarjeta>
        <FormularioRegistro />
      </Tarjeta>
      <p className="text-center text-sm text-neutral-500">
        ¿Ya tenés cuenta?{" "}
        <Link href="/ingreso" className="font-semibold text-primary-700">
          Iniciá sesión
        </Link>
      </p>
    </PantallaDeEntrada>
  );
}
