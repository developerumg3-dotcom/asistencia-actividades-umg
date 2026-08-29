import Image from "next/image";
import Link from "next/link";
import { FormularioRegistro } from "@/componentes/formulario-registro";
import { Tarjeta } from "@/componentes/ui/tarjeta";

export default function RegistroPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <Image src="/escudo-umg.webp" alt="Escudo de la Universidad Mariano Gálvez" width={56} height={56} />
        <div>
          <h1 className="text-xl font-semibold">Creá tu cuenta</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Con tu correo y una contraseña. Después completás tu carné y tu nombre.
          </p>
        </div>
      </div>
      <Tarjeta>
        <FormularioRegistro />
      </Tarjeta>
      <p className="text-center text-sm text-neutral-600">
        ¿Ya tenés cuenta?{" "}
        <Link href="/ingreso" className="underline hover:text-primary-700">
          Iniciá sesión
        </Link>
      </p>
    </main>
  );
}
