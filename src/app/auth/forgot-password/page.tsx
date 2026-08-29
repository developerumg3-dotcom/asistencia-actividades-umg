import { ForgotPasswordForm } from "@neondatabase/auth-ui";
import Image from "next/image";
import Link from "next/link";
import { localizacionEs } from "@/lib/auth/localizacion-es";
import { Tarjeta } from "@/componentes/ui/tarjeta";

export default function RecuperarContrasenaPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <Image src="/escudo-umg.webp" alt="Escudo de la Universidad Mariano Gálvez" width={56} height={56} />
        <div>
          <h1 className="text-xl font-semibold">Recuperar contraseña</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Te mandamos un enlace a tu correo para que elijas una contraseña nueva.
          </p>
        </div>
      </div>
      <Tarjeta>
        <ForgotPasswordForm localization={localizacionEs} />
      </Tarjeta>
      <Link href="/ingreso" className="text-center text-sm text-neutral-600 underline hover:text-primary-700">
        Volver a iniciar sesión
      </Link>
    </main>
  );
}
