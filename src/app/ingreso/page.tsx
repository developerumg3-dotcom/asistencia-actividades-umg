import Image from "next/image";
import Link from "next/link";
import { FormularioIngreso } from "@/componentes/formulario-ingreso";
import { Tarjeta } from "@/componentes/ui/tarjeta";

export default function IngresoPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <Image src="/escudo-umg.webp" alt="Escudo de la Universidad Mariano Gálvez" width={56} height={56} />
        <h1 className="text-xl font-semibold">Iniciá sesión</h1>
      </div>
      <Tarjeta>
        <FormularioIngreso />
      </Tarjeta>
      <div className="flex flex-col gap-2 text-center text-sm text-neutral-600">
        <Link href="/auth/forgot-password" className="underline hover:text-primary-700">
          ¿Olvidaste tu contraseña?
        </Link>
        <p>
          ¿No tenés cuenta?{" "}
          <Link href="/registro" className="underline hover:text-primary-700">
            Registrate
          </Link>
        </p>
      </div>
    </main>
  );
}
