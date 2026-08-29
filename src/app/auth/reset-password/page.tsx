import { ResetPasswordForm } from "@neondatabase/auth-ui";
import Image from "next/image";
import { localizacionEs } from "@/lib/auth/localizacion-es";
import { Tarjeta } from "@/componentes/ui/tarjeta";

export default function RestablecerContrasenaPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <Image src="/escudo-umg.webp" alt="Escudo de la Universidad Mariano Gálvez" width={56} height={56} />
        <div>
          <h1 className="text-xl font-semibold">Restablecer contraseña</h1>
          <p className="mt-1 text-sm text-neutral-600">Elegí tu contraseña nueva.</p>
        </div>
      </div>
      <Tarjeta>
        <ResetPasswordForm localization={localizacionEs} />
      </Tarjeta>
    </main>
  );
}
