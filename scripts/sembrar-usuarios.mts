/*
 * Siembra el juego minimo de datos quemados para desarrollo:
 *
 *   - un catedratico (registro de datos, NO una cuenta: decision cerrada, PLANIFICACION.md §3)
 *   - un alumno con cuenta, perfil completo e inscripciones
 *   - el administrador: completa el perfil de la cuenta real del usuario
 *
 *     pnpm db:sembrar-usuarios
 *
 * Idempotente: correrlo de nuevo no duplica nada.
 *
 * ⚠ La cuenta de alumno es real dentro del proyecto de Neon Auth y usa el dominio reservado
 * `.test`, que no existe en internet. El correo del catedratico tambien es `.test` a
 * proposito: es la direccion a la que iria el Excel, y no puede ser una real por accidente.
 * Nada de esto debe seguir vivo cuando el sistema se use de verdad.
 *
 * Borrado:
 *   delete from inscripcion where alumno_id in (select id from alumno where email like '%@ronda.test');
 *   delete from alumno where email like '%@ronda.test';
 *   update clase set docente_id = null; delete from docente;
 * y las credenciales, en la consola de Neon → Auth → Users.
 */
import { config } from "dotenv";
import { and, eq, inArray } from "drizzle-orm";

config({ path: ".env.local" });

const { db } = await import("../src/db/cliente.ts");
const { alumno, clase, docente, inscripcion } = await import("../src/db/esquema/index.ts");

const PASSWORD_PRUEBA = "Ronda2026!";

/**
 * Administrador de prueba, con contrasena conocida. Es el que hay que usar para trabajar:
 * no depende de la contrasena real de nadie.
 */
const ADMIN_PRUEBA = {
  email: "admin@ronda.test",
  nombre: "Admin de Prueba",
  carne: "0908-00-00001",
  ciclo: "1",
};

/**
 * Correo real del administrador. Su cuenta es suya: no se crea ni se le toca la
 * contrasena, solo se le completa el perfil si ya inicio sesion alguna vez.
 */
const ADMIN = {
  email: "jticasp@miumg.edu.gt",
  nombre: "Julio Cesar Ticas Palencia",
  carne: "0908-22-14264",
  ciclo: "7",
};

/** Catedratico quemado. Sin cuenta: es un registro que agrupa clases. */
const CATEDRATICO = {
  nombre: "Ing. Daniel Estuardo Morales",
  email: "daniel.morales@ronda.test",
  /** Cursos del pensum que imparte, con su seccion. */
  imparte: [
    { codigo: "031", seccion: "A" },
    { codigo: "032", seccion: "A" },
    { codigo: "033", seccion: "A" },
    { codigo: "034", seccion: "A" },
    { codigo: "035", seccion: "A" },
  ],
};

/** Alumno quemado, con cuenta. */
const ALUMNO = {
  email: "alumno@ronda.test",
  nombre: "Ana Lucia Lopez",
  carne: "0908-22-10001",
  ciclo: "7",
  cursos: ["031", "032", "033", "034", "035"],
};

const baseUrl = process.env.NEON_AUTH_BASE_URL;
if (!baseUrl) throw new Error("Falta NEON_AUTH_BASE_URL en .env.local");

// Better Auth rechaza la peticion con MISSING_ORIGIN si no llega esta cabecera: en el
// navegador la pone el propio browser, pero desde un script hay que mandarla a mano.
const CABECERAS = {
  "content-type": "application/json",
  origin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
};

/** Devuelve el id del usuario en Neon Auth, creandolo si hace falta. */
async function asegurarCuenta(email: string, nombre: string): Promise<string | null> {
  const alta = await fetch(`${baseUrl}/sign-up/email`, {
    method: "POST",
    headers: CABECERAS,
    body: JSON.stringify({ email, password: PASSWORD_PRUEBA, name: nombre }),
  });
  const cuerpo = await alta.json().catch(() => null);
  if (alta.ok && cuerpo?.user?.id) return cuerpo.user.id;

  const ingreso = await fetch(`${baseUrl}/sign-in/email`, {
    method: "POST",
    headers: CABECERAS,
    body: JSON.stringify({ email, password: PASSWORD_PRUEBA }),
  });
  const cuerpoIngreso = await ingreso.json().catch(() => null);
  if (ingreso.ok && cuerpoIngreso?.user?.id) return cuerpoIngreso.user.id;

  console.error(`  ✗ ${email}: ${JSON.stringify(cuerpo ?? cuerpoIngreso)}`);
  return null;
}

async function inscribir(alumnoId: string, codigos: string[]) {
  let nuevas = 0;
  for (const codigo of codigos) {
    const [curso] = await db.select({ id: clase.id }).from(clase).where(eq(clase.codigo, codigo)).limit(1);
    if (!curso) {
      console.warn(`  · el curso ${codigo} no esta en el catalogo, se omite`);
      continue;
    }
    const [ya] = await db
      .select({ id: inscripcion.id })
      .from(inscripcion)
      .where(and(eq(inscripcion.alumnoId, alumnoId), eq(inscripcion.claseId, curso.id)))
      .limit(1);
    if (ya) continue;
    await db.insert(inscripcion).values({ alumnoId, claseId: curso.id });
    nuevas++;
  }
  return nuevas;
}

// ---- Catedratico -------------------------------------------------------------------
let [docenteFila] = await db.select().from(docente).where(eq(docente.email, CATEDRATICO.email)).limit(1);
if (!docenteFila) {
  [docenteFila] = await db
    .insert(docente)
    .values({ nombre: CATEDRATICO.nombre, email: CATEDRATICO.email })
    .returning();
}

let asignadas = 0;
for (const { codigo, seccion } of CATEDRATICO.imparte) {
  const resultado = await db
    .update(clase)
    .set({ docenteId: docenteFila.id, seccion })
    .where(eq(clase.codigo, codigo))
    .returning({ id: clase.id });
  asignadas += resultado.length;
}
console.log(`  ✓ catedratico ${CATEDRATICO.nombre} — ${asignadas} clases asignadas`);

// ---- Alumno ------------------------------------------------------------------------
const idAlumno = await asegurarCuenta(ALUMNO.email, ALUMNO.nombre);
if (idAlumno) {
  await db
    .insert(alumno)
    .values({
      id: idAlumno,
      email: ALUMNO.email,
      carne: ALUMNO.carne,
      nombre: ALUMNO.nombre,
      ciclo: ALUMNO.ciclo,
      rol: "alumno",
      perfilCompleto: true,
    })
    .onConflictDoUpdate({
      target: alumno.id,
      set: {
        carne: ALUMNO.carne,
        nombre: ALUMNO.nombre,
        ciclo: ALUMNO.ciclo,
        rol: "alumno",
        perfilCompleto: true,
      },
    });
  const nuevas = await inscribir(idAlumno, ALUMNO.cursos);
  console.log(`  ✓ alumno ${ALUMNO.email} — ciclo ${ALUMNO.ciclo}, ${nuevas} inscripciones nuevas`);
}

// ---- Administrador de prueba -------------------------------------------------------
const idAdminPrueba = await asegurarCuenta(ADMIN_PRUEBA.email, ADMIN_PRUEBA.nombre);
if (idAdminPrueba) {
  await db
    .insert(alumno)
    .values({
      id: idAdminPrueba,
      email: ADMIN_PRUEBA.email,
      carne: ADMIN_PRUEBA.carne,
      nombre: ADMIN_PRUEBA.nombre,
      ciclo: ADMIN_PRUEBA.ciclo,
      rol: "admin",
      perfilCompleto: true,
    })
    .onConflictDoUpdate({
      target: alumno.id,
      set: {
        carne: ADMIN_PRUEBA.carne,
        nombre: ADMIN_PRUEBA.nombre,
        ciclo: ADMIN_PRUEBA.ciclo,
        rol: "admin",
        perfilCompleto: true,
      },
    });
  console.log(`  ✓ admin de prueba ${ADMIN_PRUEBA.email}`);
}

// ---- Administrador -----------------------------------------------------------------
// Su cuenta en Neon Auth es real y suya: no se crea ni se le toca la contrasena. Solo se
// le completa el perfil para que no tenga que llenarlo a mano en cada base limpia.
const filaAdmin = await db
  .update(alumno)
  .set({
    carne: ADMIN.carne,
    nombre: ADMIN.nombre,
    ciclo: ADMIN.ciclo,
    rol: "admin",
    perfilCompleto: true,
  })
  .where(eq(alumno.email, ADMIN.email))
  .returning({ email: alumno.email });

if (filaAdmin.length > 0) {
  console.log(`  ✓ admin ${ADMIN.email} — perfil completo, ciclo ${ADMIN.ciclo}`);
} else {
  console.log(
    `  · admin ${ADMIN.email}: todavia no tiene fila. Inicia sesion una vez en la app y volve a correr esto.`,
  );
}

// ---- Actividad de demostracion -----------------------------------------------------
// Arranca en el momento de sembrar y deja el marcaje abierto 24 h, para poder probar el
// kiosco y el marcaje sin tener que editar fechas a mano cada vez.
const { generarSecreto } = await import("../src/lib/qr/codigo.ts");
const { codigoCortoAleatorio } = await import("../src/lib/qr/codigo-corto.ts");
const { actividad } = await import("../src/db/esquema/index.ts");

const NOMBRE_DEMO = "Conferencia de ciberseguridad";
const [demoExistente] = await db
  .select({ id: actividad.id, codigoCorto: actividad.codigoCorto })
  .from(actividad)
  .where(eq(actividad.nombre, NOMBRE_DEMO))
  .limit(1);

if (demoExistente) {
  console.log(`  · actividad "${NOMBRE_DEMO}" ya existe (/${demoExistente.codigoCorto})`);
} else {
  const ahora = new Date();
  const enHoras = (h: number) => new Date(ahora.getTime() + h * 3600_000);
  const [creada] = await db
    .insert(actividad)
    .values({
      codigoCorto: codigoCortoAleatorio(),
      nombre: NOMBRE_DEMO,
      descripcion: "Actividad de prueba para el kiosco y el marcaje.",
      lugar: "Salón 201",
      tipo: "global",
      puntos: 1,
      iniciaEn: ahora,
      terminaEn: enHoras(2),
      marcajeAbreEn: ahora,
      marcajeCierraEn: enHoras(24),
      estado: "publicada",
      ventanaSeg: 60,
      secretoQr: generarSecreto(),
    })
    .returning({ codigoCorto: actividad.codigoCorto });
  console.log(`  ✓ actividad "${NOMBRE_DEMO}" creada (/${creada.codigoCorto})`);
}

// ---- Resumen -----------------------------------------------------------------------
const conDocente = await db
  .select({ id: clase.id })
  .from(clase)
  .where(inArray(clase.codigo, CATEDRATICO.imparte.map((c) => c.codigo)));
console.log(`\nListo. Contrasena del alumno de prueba: ${PASSWORD_PRUEBA}`);
console.log(`Clases con catedratico asignado: ${conDocente.length}`);
