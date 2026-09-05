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
 * `auth.getSession()` a veces necesita refrescar la cookie de cache de sesión (vence cada
 * `sessionDataTtl`), y para eso escribe una cookie — algo que Next.js prohíbe fuera de un
 * Server Action o Route Handler. Un Server Component puro (como la pagina a la que llega el
 * QR) no es ninguno de los dos, así que esa escritura tronaba con una excepción sin capturar
 * y tumbaba la pagina entera (500 en cada primer render con la cache vencida). Tratar ese
 * fallo como "sin sesion" en vez de dejarlo reventar es peor solo en el caso raro de que la
 * cache expire justo cuando entra un alumno de verdad logueado: ve el cartel de "iniciar
 * sesion" un instante en vez de la pantalla de marcar, y se resuelve solo en la siguiente
 * carga (el propio cliente ya llama a /api/auth/get-session, que si puede refrescar la
 * cookie porque corre como Route Handler).
 */
async function obtenerSesion() {
  try {
    const { data: sesion } = await auth.getSession();
    return sesion;
  } catch (error) {
    console.error("[obtenerAlumnoActual] auth.getSession() fallo, se trata como sin sesion:", error);
    return null;
  }
}

/**
 * La fila de `alumno` no se crea por webhook: se crea perezosamente en la primera petición
 * autenticada. Evita depender de un NEON_API_KEY o un endpoint público adicional que no
 * están en ESTRUCTURA.md.
 */
export const obtenerAlumnoActual = cache(async (): Promise<Alumno | null> => {
  const sesion = await obtenerSesion();
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
