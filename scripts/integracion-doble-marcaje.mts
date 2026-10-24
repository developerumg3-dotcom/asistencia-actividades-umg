/*
 * Pruebas de integracion del doble marcaje (PLANIFICACION.md §6.5). Tocan la base de verdad.
 *
 *     pnpm probar:base
 *
 * Necesitan la migracion 0007 aplicada. Crean su propio alumno, clase y actividades con
 * nombre marcado, y borran todo al terminar. Las ventanas se mueven con el parametro
 * `momento` de `registrarMarcaje`, asi que no hay que esperar a ninguna hora real.
 */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { config } from "dotenv";
import { eq, like } from "drizzle-orm";

config({ path: ".env.local" });

const { db } = await import("../src/db/cliente.ts");
const { actividad, alumno, asistencia, bitacora, clase, inscripcion } = await import(
  "../src/db/esquema/index.ts"
);
const { registrarMarcaje, registrarMarcajeManual } = await import("../src/lib/qr/marcaje.ts");
const { codigoVigente, generarSecreto } = await import("../src/lib/qr/codigo.ts");
const { obtenerParticipaciones } = await import("../src/lib/puntos/consulta.ts");

const MARCA = "zzz-prueba-doble";
const SECRETO = generarSecreto();
const VENTANA = 60;

// Entrada de 2:00 a 2:30 y salida de 3:30 a 4:00, como el ejemplo del pedido.
const BASE = new Date("2026-10-24T20:00:00Z"); // 2:00 p. m. en Guatemala
const min = (m: number) => new Date(BASE.getTime() + m * 60_000);
const ENTRADA = min(10);
const HUECO = min(60);
const SALIDA = min(100);
const TARDE = min(150);

let idActividad = "";
let idAlumno = "";
let idClase = "";
let codigoCorto = "";
const alumnoPrueba = () => ({ id: idAlumno, perfilCompleto: true });
const codigoEn = (momento: Date) => codigoVigente(SECRETO, idActividad, VENTANA, momento);
const marcarEn = (momento: Date) =>
  registrarMarcaje({ alumno: alumnoPrueba(), codigoCorto, codigo: codigoEn(momento), momento });

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
  const clases = await db.select({ id: clase.id }).from(clase).where(like(clase.nombre, `${MARCA}%`));
  for (const { id } of clases) {
    await db.delete(inscripcion).where(eq(inscripcion.claseId, id));
    await db.delete(clase).where(eq(clase.id, id));
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

  const [laClase] = await db
    .insert(clase)
    .values({ codigo: `${MARCA}-c`, nombre: `${MARCA} clase`, jornada: "zzz", ciclo: "1" })
    .returning({ id: clase.id });
  idClase = laClase.id;
  await db.insert(inscripcion).values({ alumnoId: idAlumno, claseId: idClase });

  codigoCorto = `zd${Math.floor(Math.random() * 900 + 100)}`;
  const [creada] = await db
    .insert(actividad)
    .values({
      codigoCorto,
      nombre: `${MARCA} conferencia`,
      tipo: "global",
      puntos: 1,
      iniciaEn: BASE,
      terminaEn: min(120),
      marcajeAbreEn: BASE,
      marcajeCierraEn: min(30),
      dobleMarcaje: true,
      salidaAbreEn: min(90),
      salidaCierraEn: min(120),
      estado: "publicada",
      ventanaSeg: VENTANA,
      secretoQr: SECRETO,
    })
    .returning({ id: actividad.id });
  idActividad = creada.id;
});

after(limpiar);

const puntosDeLaClase = async () => {
  const tabla = await obtenerParticipaciones(idAlumno);
  return tabla.filas.find((f) => f.claseId === idClase)?.total ?? 0;
};

test("una salida sin entrada se rechaza, queda en bitacora y no crea asistencia", async () => {
  const r = await marcarEn(SALIDA);
  assert.equal(r.resultado, "sin_entrada");
  const filas = await db.select().from(asistencia).where(eq(asistencia.actividadId, idActividad));
  assert.equal(filas.length, 0);
  const [anotado] = await db
    .select({ resultado: bitacora.resultado })
    .from(bitacora)
    .where(eq(bitacora.alumnoId, idAlumno));
  assert.equal(anotado.resultado, "sin_entrada");
});

test("el hueco entre la entrada y la salida es fuera de horario", async () => {
  const r = await marcarEn(HUECO);
  assert.equal(r.resultado, "fuera_de_horario");
});

test("la entrada se guarda, avisa que falta la salida, y todavia no da punto", async () => {
  const r = await marcarEn(ENTRADA);
  assert.equal(r.resultado, "ok");
  assert.ok(r.resultado === "ok" && r.fase === "entrada" && r.faltaSalida !== null);
  assert.equal(await puntosDeLaClase(), 0, "con solo la entrada no hay punto");
});

test("una segunda entrada es duplicado", async () => {
  const r = await marcarEn(ENTRADA);
  assert.equal(r.resultado, "duplicado");
});

test("la salida completa la misma fila y recien ahi aparece el punto", async () => {
  const r = await marcarEn(SALIDA);
  assert.equal(r.resultado, "ok");
  assert.ok(r.resultado === "ok" && r.fase === "salida");
  const filas = await db.select().from(asistencia).where(eq(asistencia.actividadId, idActividad));
  assert.equal(filas.length, 1, "sigue siendo una sola fila");
  assert.ok(filas[0].salidaEn, "la fila quedo con salida");
  assert.equal(await puntosDeLaClase(), 1);
});

test("una segunda salida es duplicado", async () => {
  const r = await marcarEn(SALIDA);
  assert.equal(r.resultado, "duplicado");
});

test("despues de la salida ya no se acepta nada", async () => {
  const r = await marcarEn(TARDE);
  assert.equal(r.resultado, "fuera_de_horario");
});

test("marcaje manual: la salida exige entrada, y la completa cuando existe", async () => {
  await db.delete(asistencia).where(eq(asistencia.actividadId, idActividad));

  const sin = await registrarMarcajeManual({
    actividadId: idActividad,
    identificadorAlumno: `${MARCA}-carne`,
    justificacion: "prueba",
    fase: "salida",
  });
  assert.equal(sin.resultado, "sin_entrada");

  const entrada = await registrarMarcajeManual({
    actividadId: idActividad,
    identificadorAlumno: `${MARCA}-carne`,
    justificacion: "prueba",
  });
  assert.equal(entrada.resultado, "ok");
  assert.equal(await puntosDeLaClase(), 0);

  const salida = await registrarMarcajeManual({
    actividadId: idActividad,
    identificadorAlumno: `${MARCA}-carne`,
    justificacion: "se le cayo el telefono",
    fase: "salida",
  });
  assert.equal(salida.resultado, "ok");
  assert.equal(await puntosDeLaClase(), 1);
});
