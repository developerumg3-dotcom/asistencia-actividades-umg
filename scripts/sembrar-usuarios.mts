/*
 * Crea cuentas de PRUEBA para desarrollo.
 *
 *     pnpm db:sembrar-usuarios
 *
 * Idempotente: si la cuenta ya existe en Neon Auth, no la duplica; solo se asegura de que
 * la fila de `alumno` tenga perfil completo y sus inscripciones.
 *
 * ⚠ Estas cuentas son reales dentro del proyecto de Neon Auth. Todas comparten la misma
 * contraseña y usan el dominio reservado `.test`, que no existe en internet. Sirven para
 * ver la app con datos; NO deben quedar vivas cuando el sistema se use de verdad.
 * Para borrarlas: consola de Neon → Auth → Users, y `delete from alumno where email like
 * '%@ronda.test'` (las inscripciones caen con la fila por la FK).
 */
import { config } from "dotenv";
import { and, eq } from "drizzle-orm";

config({ path: ".env.local" });

const { db } = await import("../src/db/cliente.ts");
const { alumno, clase, inscripcion } = await import("../src/db/esquema/index.ts");

export const PASSWORD_PRUEBA = "Ronda2026!";

type Semilla = {
  email: string;
  nombre: string;
  carne: string;
  rol: "alumno" | "admin";
  /** Ciclo declarado en el perfil: decide el filtro inicial de A4. */
  ciclo: string;
  /** Codigos del pensum en los que queda inscrito. */
  cursos: string[];
};

// Los cursos mezclan ciclos a proposito: es el escenario real que motivo el catalogo
// completo — hay quien lleva materias atrasadas y quien las lleva adelantadas.
const SEMILLAS: Semilla[] = [
  {
    email: "admin@ronda.test",
    nombre: "Administrador de Prueba",
    carne: "0908-00-00001",
    rol: "admin",
    ciclo: "1",
    cursos: [],
  },
  {
    email: "ana.lopez@ronda.test",
    nombre: "Ana Lucía López",
    carne: "0908-21-10001",
    rol: "alumno",
    ciclo: "7",
    cursos: ["031", "032", "033", "034", "035"],
  },
  {
    email: "carlos.mendez@ronda.test",
    nombre: "Carlos Méndez",
    carne: "0908-21-10002",
    rol: "alumno",
    ciclo: "7",
    // Séptimo ciclo con dos materias atrasadas del quinto.
    cursos: ["031", "032", "033", "021", "025"],
  },
  {
    email: "maria.tzoc@ronda.test",
    nombre: "María Tzoc",
    carne: "0908-22-10003",
    rol: "alumno",
    ciclo: "8",
    // Octavo ciclo y una adelantada del noveno.
    cursos: ["036", "037", "038", "039", "044"],
  },
  {
    email: "jorge.ramirez@ronda.test",
    nombre: "Jorge Ramírez",
    carne: "0908-20-10004",
    rol: "alumno",
    ciclo: "10",
    cursos: ["046", "047", "048"],
  },
  {
    email: "sofia.castillo@ronda.test",
    nombre: "Sofía Castillo",
    carne: "0908-23-10005",
    rol: "alumno",
    ciclo: "1",
    cursos: ["001", "002", "003", "004", "005"],
  },
  {
    email: "luis.garcia@ronda.test",
    nombre: "Luis García",
    carne: "0908-23-10006",
    rol: "alumno",
    ciclo: "3",
    // Sin inscripciones: sirve para ver A4 vacia y probar el filtro desde cero.
    cursos: [],
  },
];

const baseUrl = process.env.NEON_AUTH_BASE_URL;
if (!baseUrl) throw new Error("Falta NEON_AUTH_BASE_URL en .env.local");

// Better Auth rechaza la peticion con MISSING_ORIGIN si no llega esta cabecera: en el
// navegador la pone el propio browser, pero desde un script hay que mandarla a mano.
const origen = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const CABECERAS = { "content-type": "application/json", origin: origen };

/** Devuelve el id del usuario en Neon Auth, creandolo si hace falta. */
async function asegurarCuenta(semilla: Semilla): Promise<string | null> {
  const respuesta = await fetch(`${baseUrl}/sign-up/email`, {
    method: "POST",
    headers: CABECERAS,
    body: JSON.stringify({
      email: semilla.email,
      password: PASSWORD_PRUEBA,
      name: semilla.nombre,
    }),
  });

  const cuerpo = await respuesta.json().catch(() => null);

  if (respuesta.ok && cuerpo?.user?.id) return cuerpo.user.id;

  // Ya existia: iniciar sesion para recuperar el id.
  const ingreso = await fetch(`${baseUrl}/sign-in/email`, {
    method: "POST",
    headers: CABECERAS,
    body: JSON.stringify({ email: semilla.email, password: PASSWORD_PRUEBA }),
  });
  const cuerpoIngreso = await ingreso.json().catch(() => null);
  if (ingreso.ok && cuerpoIngreso?.user?.id) return cuerpoIngreso.user.id;

  console.error(
    `  ✗ ${semilla.email}: no se pudo crear ni autenticar.`,
    JSON.stringify(cuerpo ?? cuerpoIngreso),
  );
  return null;
}

/** Neon Auth limita peticiones seguidas: sin esta pausa las ultimas cuentas fallan. */
const esperar = (ms: number) => new Promise((listo) => setTimeout(listo, ms));

let creados = 0;
for (const [indice, semilla] of SEMILLAS.entries()) {
  if (indice > 0) await esperar(1500);
  const id = await asegurarCuenta(semilla);
  if (!id) continue;

  await db
    .insert(alumno)
    .values({
      id,
      email: semilla.email,
      carne: semilla.carne,
      nombre: semilla.nombre,
      rol: semilla.rol,
      ciclo: semilla.ciclo,
      perfilCompleto: true,
    })
    .onConflictDoUpdate({
      target: alumno.id,
      set: {
        carne: semilla.carne,
        nombre: semilla.nombre,
        rol: semilla.rol,
        ciclo: semilla.ciclo,
        perfilCompleto: true,
      },
    });

  let inscritas = 0;
  for (const codigo of semilla.cursos) {
    const [curso] = await db.select({ id: clase.id }).from(clase).where(eq(clase.codigo, codigo)).limit(1);
    if (!curso) {
      console.warn(`  · curso ${codigo} no existe en el catalogo, se omite`);
      continue;
    }
    const [ya] = await db
      .select({ id: inscripcion.id })
      .from(inscripcion)
      .where(and(eq(inscripcion.alumnoId, id), eq(inscripcion.claseId, curso.id)))
      .limit(1);
    if (ya) continue;
    await db.insert(inscripcion).values({ alumnoId: id, claseId: curso.id });
    inscritas++;
  }

  creados++;
  console.log(`  ✓ ${semilla.email.padEnd(28)} ${semilla.rol.padEnd(7)} ${inscritas} inscripciones nuevas`);
}

console.log(`\n${creados} de ${SEMILLAS.length} cuentas listas. Contraseña: ${PASSWORD_PRUEBA}`);
