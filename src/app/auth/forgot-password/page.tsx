import { ForgotPasswordForm } from "@neondatabase/auth-ui";
import Link from "next/link";
import { localizacionEs } from "@/lib/auth/localizacion-es";
import { Marca, PantallaDeEntrada } from "@/componentes/ui/marca";
import { Tarjeta } from "@/componentes/ui/tarjeta";

export default function RecuperarContrasenaPage() {
  return (
    <PantallaDeEntrada>
      <Marca
        titulo="Recuperar contraseña"
        bajada="Te mandamos un enlace a tu correo para que elijas una contraseña nueva."
      />
      <Tarjeta>
        <ForgotPasswordForm localization={localizacionEs} />
      </Tarjeta>
      <Link href="/ingreso" className="text-center text-sm font-semibold text-primary-700">
        Volver a iniciar sesión
      </Link>
    </PantallaDeEntrada>
  );
}
