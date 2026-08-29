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

  redirect("/");
}
