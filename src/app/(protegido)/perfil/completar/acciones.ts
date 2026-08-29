"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db/cliente";
import { alumno } from "@/db/esquema";
import { requireAlumno } from "@/lib/sesion";

export type EstadoFormulario = { error: string | null };

/** Los diez ciclos del pensum. El <select> ya limita, pero el servidor no confia en el. */
const CICLOS_VALIDOS = new Set(Array.from({ length: 10 }, (_, i) => String(i + 1)));

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
  const ciclo = String(formData.get("ciclo") ?? "").trim();

  if (!carne || !nombre || !ciclo) {
    return { error: "Completá tu carné, tu nombre completo y tu ciclo." };
  }
  if (!CICLOS_VALIDOS.has(ciclo)) {
    return { error: "Elegí un ciclo de la lista." };
  }

  try {
    await db
      .update(alumno)
      .set({ carne, nombre, ciclo, perfilCompleto: true })
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
