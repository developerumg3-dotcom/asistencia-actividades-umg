/*
 * Pruebas de integracion del marcaje. Tocan la base de verdad.
 *
 *     pnpm probar:base
 *
 * Crean su propia actividad y su propio alumno, con nombres marcados, y borran todo al
 * terminar — incluso si una prueba falla. No dependen de los datos sembrados ni los ensucian.
 *
 * Van aparte de `pnpm probar` a proposito: aquellas son puras y corren sin red.
 */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { config } from "dotenv";
import { and, eq, like, sql } from "drizzle-orm";

config({ path: ".env.local" });

const { db } = await import("../src/db/cliente.ts");
const { actividad, alumno, asistencia, bitacora, clase, inscripcion } = await import(
  "../src/db/esquema/index.ts"
);
const { registrarMarcaje } = await import("../src/lib/qr/marcaje.ts");
const { codigoVigente, generarSecreto } = await import("../src/lib/qr/codigo.ts");

const MARCA = "zzz-prueba-marcaje";
const SECRETO = generarSecreto();
const VENTANA = 60;

const AHORA = new Date();
const enHoras = (h: number) => new Date(AHORA.getTime() + h * 3600_000);

let idActividad = "";
let idAlumno = "";
let codigoCorto = "";
const alumnoPrueba = () => ({ id: idAlumno, perfilCompleto: true });

async function limpiar() {
  const ids = await db.select({ id: actividad.id }).from(actividad).where(like(actividad.nombre, `${MARCA}%`));
  for (const { id } of ids) {
    await db.delete(bitacora).where(eq(bitacora.actividadId, id));
    await db.delete(asistencia).where(eq(asistencia.actividadId, id));
    await db.delete(actividad).where(eq(actividad.id, id));
  }
  const alumnos = await db.select({ id: alumno.id }).from(alumno).where(like(alumno.email, `${MARCA}%`));
  for (const { id } of alumnos) {
    await db.delete(bitacora).where(eq(bitacora.alumnoId, id));
    await db.delete(inscripcion).where(eq(inscripcion.alumnoId, id));
    await db.delete(alumno).where(eq(alumno.id, id));
  }
}

before(async () => {
  await limpiar();

  idAlumno = `${MARCA}-alumno`;
  await db.insert(alumno).values({
    id: idAlumno,
    email: `${MARCA}@ronda.test`,
    carne: `${MARCA}-carne`,
    nombre: "Alumno de prueba",
    ciclo: "7",
    perfilCompleto: true,
  });

  codigoCorto = `zz${Math.floor(Math.random() * 900 + 100)}`;
  const [creada] = await db
    .insert(actividad)
    .values({
      codigoCorto,
      nombre: `${MARCA} conferencia`,
      tipo: "global",
      puntos: 1,
      iniciaEn: AHORA,
      terminaEn: enHoras(2),
      marcajeAbreEn: enHoras(-1),
      marcajeCierraEn: enHoras(24),
      estado: "publicada",
      ventanaSeg: VENTANA,
      secretoQr: SECRETO,
    })
    .returning({ id: actividad.id });
  idActividad = creada.id;
});

after(limpiar);

/** Cuantas filas de bitacora hay para este alumno, y con que resultado la ultima. */
async function ultimaBitacora() {
  const filas = await db
    .select({ resultado: bitacora.resultado, evento: bitacora.evento })
    .from(bitacora)
    .where(eq(bitacora.alumnoId, idAlumno))
    .orderBy(sql`ocurrio_en desc`)
    .limit(1);
  return filas[0];
}

async function contarBitacora() {
  const filas = await db.select({ id: bitacora.id }).from(bitacora).where(eq(bitacora.alumnoId, idAlumno));
  return filas.length;
}

test("un codigo de otra actividad no sirve", async () => {
  const ajeno = codigoVigente(generarSecreto(), idActividad, VENTANA, AHORA);
  const r = await registrarMarcaje({
    alumno: alumnoPrueba(),
    codigoCorto,
    codigo: ajeno,
    momento: AHORA,
  });
  assert.equal(r.resultado, "invalido");
  assert.equal((await ultimaBitacora())?.resultado, "invalido");
});

test("un codigo vencido responde expirado, no invalido", async () => {
  const viejo = codigoVigente(SECRETO, idActividad, VENTANA, new Date(AHORA.getTime() - 180_000));
  const r = await registrarMarcaje({
    alumno: alumnoPrueba(),
    codigoCorto,
    codigo: viejo,
    momento: AHORA,
  });
  assert.equal(r.resultado, "expirado");
});

test("una actividad que no existe es invalido y queda en bitacora", async () => {
  const antes = await contarBitacora();
  const r = await registrarMarcaje({
    alumno: alumnoPrueba(),
    codigoCorto: "noexiste",
    codigo: codigoVigente(SECRETO, idActividad, VENTANA, AHORA),
    momento: AHORA,
  });
  assert.equal(r.resultado, "invalido");
  assert.equal(r.actividadNombre, null);
  assert.equal(await contarBitacora(), antes + 1);
});

test("sin perfil completo no se marca", async () => {
  const r = await registrarMarcaje({
    alumno: { id: idAlumno, perfilCompleto: false },
    codigoCorto,
    codigo: codigoVigente(SECRETO, idActividad, VENTANA, AHORA),
    momento: AHORA,
  });
  assert.equal(r.resultado, "sin_perfil");
});

test("fuera de la ventana de marcaje no se acredita aunque el codigo sea el vigente", async () => {
  const tarde = enHoras(48);
  const r = await registrarMarcaje({
    alumno: alumnoPrueba(),
    codigoCorto,
    codigo: codigoVigente(SECRETO, idActividad, VENTANA, tarde),
    momento: tarde,
  });
  assert.equal(r.resultado, "fuera_de_horario");
});

test("un borrador no acepta marcaje", async () => {
  await db.update(actividad).set({ estado: "borrador" }).where(eq(actividad.id, idActividad));
  const r = await registrarMarcaje({
    alumno: alumnoPrueba(),
    codigoCorto,
    codigo: codigoVigente(SECRETO, idActividad, VENTANA, AHORA),
    momento: AHORA,
  });
  assert.equal(r.resultado, "fuera_de_horario");
  await db.update(actividad).set({ estado: "publicada" }).where(eq(actividad.id, idActividad));
});

test("el marcaje valido se guarda y queda en bitacora", async () => {
  const r = await registrarMarcaje({
    alumno: alumnoPrueba(),
    codigoCorto,
    codigo: codigoVigente(SECRETO, idActividad, VENTANA, AHORA),
    momento: AHORA,
    datos: { ip: "190.0.0.1", dispositivoId: "prueba" },
  });
  assert.equal(r.resultado, "ok");

  const filas = await db
    .select({ origen: asistencia.origen, slot: asistencia.slot })
    .from(asistencia)
    .where(and(eq(asistencia.alumnoId, idAlumno), eq(asistencia.actividadId, idActividad)));
  assert.equal(filas.length, 1);
  assert.equal(filas[0].origen, "qr");
  assert.equal((await ultimaBitacora())?.resultado, "ok");
});

test("se guarda aunque el alumno no tenga ninguna clase inscrita", async () => {
  const inscritas = await db
    .select({ id: inscripcion.id })
    .from(inscripcion)
    .where(eq(inscripcion.alumnoId, idAlumno));
  assert.equal(inscritas.length, 0, "el alumno de prueba no deberia tener clases");

  const guardada = await db
    .select({ clases: asistencia.clasesSnapshot })
    .from(asistencia)
    .where(and(eq(asistencia.alumnoId, idAlumno), eq(asistencia.actividadId, idActividad)));
  assert.equal(guardada.length, 1, "la asistencia tiene que existir igual");
  assert.deepEqual(guardada[0].clases, []);
});

test("el segundo intento responde duplicado con la hora del primero", async () => {
  const r = await registrarMarcaje({
    alumno: alumnoPrueba(),
    codigoCorto,
    codigo: codigoVigente(SECRETO, idActividad, VENTANA, AHORA),
    momento: new Date(AHORA.getTime() + 1000),
  });
  assert.equal(r.resultado, "duplicado");
  assert.ok("marcadaEn" in r && r.marcadaEn instanceof Date);

  const filas = await db
    .select({ id: asistencia.id })
    .from(asistencia)
    .where(and(eq(asistencia.alumnoId, idAlumno), eq(asistencia.actividadId, idActividad)));
  assert.equal(filas.length, 1, "no debe haberse creado una segunda asistencia");
});

test("al que ya marco se le dice duplicado, no expirado", async () => {
  const viejo = codigoVigente(SECRETO, idActividad, VENTANA, new Date(AHORA.getTime() - 600_000));
  const r = await registrarMarcaje({
    alumno: alumnoPrueba(),
    codigoCorto,
    codigo: viejo,
    momento: AHORA,
  });
  assert.equal(r.resultado, "duplicado");
});

test("todo intento quedo anotado: ninguno se perdio", async () => {
  const filas = await db
    .select({ evento: bitacora.evento })
    .from(bitacora)
    .where(eq(bitacora.alumnoId, idAlumno));
  // Nueve llamadas a registrarMarcaje en las pruebas de arriba.
  assert.equal(filas.length, 9, `se esperaban 9 anotaciones y hay ${filas.length}`);
  assert.ok(filas.every((f) => f.evento === "marcaje"));
});
