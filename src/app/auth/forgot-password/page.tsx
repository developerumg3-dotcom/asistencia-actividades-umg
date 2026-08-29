import { ForgotPasswordForm } from "@neondatabase/auth-ui";
import Link from "next/link";
import { localizacionEs } from "@/lib/auth/localizacion-es";

export default function RecuperarContrasenaPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Recuperar contraseña</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Te mandamos un enlace a tu correo para que elijas una contraseña nueva.
        </p>
      </div>
      <ForgotPasswordForm localization={localizacionEs} />
      <Link href="/ingreso" className="text-sm text-neutral-600 underline">
        Volver a iniciar sesión
      </Link>
    </main>
  );
}
