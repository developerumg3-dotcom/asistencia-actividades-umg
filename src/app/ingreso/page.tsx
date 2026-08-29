import Link from "next/link";
import { FormularioIngreso } from "@/componentes/formulario-ingreso";

export default function IngresoPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Iniciá sesión</h1>
      </div>
      <FormularioIngreso />
      <div className="flex flex-col gap-2 text-sm text-neutral-600">
        <Link href="/auth/forgot-password" className="underline">
          ¿Olvidaste tu contraseña?
        </Link>
        <p>
          ¿No tenés cuenta?{" "}
          <Link href="/registro" className="underline">
            Registrate
          </Link>
        </p>
      </div>
    </main>
  );
}
