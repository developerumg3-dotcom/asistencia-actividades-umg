import Link from "next/link";
import { FormularioRegistro } from "@/componentes/formulario-registro";

export default function RegistroPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Creá tu cuenta</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Con tu correo y una contraseña. Después completás tu carné y tu nombre.
        </p>
      </div>
      <FormularioRegistro />
      <p className="text-sm text-neutral-600">
        ¿Ya tenés cuenta?{" "}
        <Link href="/ingreso" className="underline">
          Iniciá sesión
        </Link>
      </p>
    </main>
  );
}
