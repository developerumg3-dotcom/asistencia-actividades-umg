"use server";

import { and, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db/cliente";
import { alumno, clase, inscripcion } from "@/db/esquema";
import { errorDeDatosPerfil } from "@/lib/perfil";
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
  const ciclo = String(formData.get("ciclo") ?? "").trim();
  const cursosElegidos = [...new Set(formData.getAll("cursos").map((v) => String(v)))];

  const errorDatos = errorDeDatosPerfil({ carne, nombre, ciclo, cantidadCursos: cursosElegidos.length });
  if (errorDatos) return { error: errorDatos };

  // No se confía en los ids que manda el cliente: se valida que existan y esten activos.
  const clasesValidas = await db
    .select({ id: clase.id })
    .from(clase)
    .where(and(inArray(clase.id, cursosElegidos), eq(clase.activa, true)));
  if (clasesValidas.length !== cursosElegidos.length) {
    return { error: "Uno de los cursos elegidos ya no está disponible. Revisá la lista." };
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

  await db
    .insert(inscripcion)
    .values(cursosElegidos.map((claseId) => ({ alumnoId: alumnoActual.id, claseId })))
    .onConflictDoNothing();
  revalidatePath("/clases");

  redirect("/");
}
