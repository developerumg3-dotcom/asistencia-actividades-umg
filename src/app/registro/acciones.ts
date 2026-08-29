"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";

export type EstadoFormulario = { error: string | null };

export async function registrarse(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Completá el correo y la contraseña." };
  }
  if (password.length < 8) {
    return { error: "La contraseña necesita al menos 8 caracteres." };
  }

  const { error } = await auth.signUp.email({ email, password, name: email });
  if (error) {
    return { error: error.message ?? "No se pudo crear la cuenta. Intentá de nuevo." };
  }

  redirect("/perfil/completar");
}
