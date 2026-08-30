"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/cliente";
import { docente } from "@/db/esquema";
import { requireAdmin } from "@/lib/sesion";

export type EstadoFormulario = { error: string | null };

export async function crearDocente(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await requireAdmin();
  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  if (!nombre) {
    return { error: "Completá el nombre del catedrático." };
  }

  await db.insert(docente).values({ nombre, email: email || null });
  revalidatePath("/admin/catedraticos");
  return { error: null };
}

export async function actualizarDocente(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  if (!id || !nombre) {
    return { error: "Completá el nombre." };
  }

  await db.update(docente).set({ nombre, email: email || null }).where(eq(docente.id, id));
  revalidatePath("/admin/catedraticos");
  return { error: null };
}
