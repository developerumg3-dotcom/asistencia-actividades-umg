import { ResetPasswordForm } from "@neondatabase/auth-ui";
import { localizacionEs } from "@/lib/auth/localizacion-es";
import { Marca, PantallaDeEntrada } from "@/componentes/ui/marca";
import { Tarjeta } from "@/componentes/ui/tarjeta";

export default function RestablecerContrasenaPage() {
  return (
    <PantallaDeEntrada>
      <Marca titulo="Restablecer contraseña" bajada="Elegí tu contraseña nueva." />
      <Tarjeta>
        <ResetPasswordForm localization={localizacionEs} />
      </Tarjeta>
    </PantallaDeEntrada>
  );
}
