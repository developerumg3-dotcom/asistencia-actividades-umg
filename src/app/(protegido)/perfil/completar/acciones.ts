"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db/cliente";
import { alumno } from "@/db/esquema";
import { requireAlumno } from "@/lib/sesion";

export type EstadoFormulario = { error: string | null };

// El driver de @neondatabase/serverless envuelve el error real de Postgres dentro de
// `.cause` (drizzle solo expone un "Failed query" genérico en el nivel superior).
function esViolacionDeUnicidad(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  if ("code" in error && (error as { code?: string }).code === "23505") return true;
  if ("cause" in error) return esViolacionDeUnicidad((error as { cause?: unknown }).cause);
  return false;
}

export async function completarPerfil(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const alumnoActual = await requireAlumno();

  const carne = String(formData.get("carne") ?? "").trim();
  const nombre = String(formData.get("nombre") ?? "").trim();

  if (!carne || !nombre) {
    return { error: "Completá tu carné y tu nombre completo." };
  }

  try {
    await db
      .update(alumno)
      .set({ carne, nombre, perfilCompleto: true })
      .where(eq(alumno.id, alumnoActual.id));
  } catch (error) {
    if (esViolacionDeUnicidad(error)) {
      return {
        error: "Ese carné ya está registrado. Si es el tuyo, pedile al administrador que lo libere.",
      };
    }
    throw error;
  }

  redirect("/");
}
