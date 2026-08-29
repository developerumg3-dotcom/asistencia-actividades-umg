import { ResetPasswordForm } from "@neondatabase/auth-ui";
import { localizacionEs } from "@/lib/auth/localizacion-es";

export default function RestablecerContrasenaPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Restablecer contraseña</h1>
        <p className="mt-1 text-sm text-neutral-600">Elegí tu contraseña nueva.</p>
      </div>
      <ResetPasswordForm localization={localizacionEs} />
    </main>
  );
}
