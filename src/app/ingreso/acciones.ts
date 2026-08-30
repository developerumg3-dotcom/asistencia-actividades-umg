"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";

export type EstadoFormulario = { error: string | null };

export async function iniciarSesion(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Completá el correo y la contraseña." };
  }

  const { error } = await auth.signIn.email({ email, password });
  if (error) {
    return { error: "Correo o contraseña incorrectos." };
  }

  redirect(destinoSeguro(formData.get("destino")));
}

/**
 * A donde volver despues de entrar. La pagina de marcaje manda su propia URL, para que el
 * alumno que llego escaneando no pierda el codigo por pasar por el login (PLANIFICACION.md §6.4).
 *
 * Solo se aceptan rutas internas: un destino que empiece por "//" o por un esquema seria un
 * redirect abierto, y el enlace lo puede fabricar cualquiera y mandarlo por WhatsApp.
 */
function destinoSeguro(valor: FormDataEntryValue | null): string {
  const destino = typeof valor === "string" ? valor.trim() : "";
  if (!destino.startsWith("/") || destino.startsWith("//")) return "/";
  return destino;
}
