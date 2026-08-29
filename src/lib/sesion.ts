import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db/cliente";
import { alumno, type alumno as AlumnoTabla } from "@/db/esquema";
import { auth } from "@/lib/auth/server";

type Alumno = typeof AlumnoTabla.$inferSelect;

function correoEsAdmin(email: string): boolean {
  const lista = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((correo) => correo.trim().toLowerCase())
    .filter(Boolean);
  return lista.includes(email.toLowerCase());
}

/**
 * La fila de `alumno` no se crea por webhook: se crea perezosamente en la primera petición
 * autenticada. Evita depender de un NEON_API_KEY o un endpoint público adicional que no
 * están en ESTRUCTURA.md.
 */
export const obtenerAlumnoActual = cache(async (): Promise<Alumno | null> => {
  const { data: sesion } = await auth.getSession();
  if (!sesion?.user) return null;

  const [existente] = await db.select().from(alumno).where(eq(alumno.id, sesion.user.id)).limit(1);
  if (existente) return existente;

  const [nuevo] = await db
    .insert(alumno)
    .values({
      id: sesion.user.id,
      email: sesion.user.email,
      rol: correoEsAdmin(sesion.user.email) ? "admin" : "alumno",
    })
    .onConflictDoNothing({ target: alumno.id })
    .returning();
  if (nuevo) return nuevo;

  // Otra petición concurrente ya insertó la fila entre el select y el insert.
  const [creada] = await db.select().from(alumno).where(eq(alumno.id, sesion.user.id)).limit(1);
  return creada ?? null;
});

export async function requireAlumno(): Promise<Alumno> {
  const alumnoActual = await obtenerAlumnoActual();
  if (!alumnoActual) redirect("/ingreso");
  return alumnoActual;
}

export async function requireAdmin(): Promise<Alumno> {
  const alumnoActual = await requireAlumno();
  if (alumnoActual.rol !== "admin") redirect("/");
  return alumnoActual;
}
