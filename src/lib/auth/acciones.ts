"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";

export async function cerrarSesion(): Promise<void> {
  await auth.signOut();
  redirect("/ingreso");
}
