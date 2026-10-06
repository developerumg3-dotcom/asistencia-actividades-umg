/*
 * Pruebas de integracion del reparto de puntos extra. Tocan la base de verdad.
 *
 *     pnpm probar:base
 *
 * Cierran el riesgo abierto de ASI2-14: `repartirPuntos` paso de un candado dentro de una CTE
 * (que no servia: en READ COMMITTED la sentencia toma su foto ANTES de esperar el candado) a
 * dos sentencias dentro de un `db.batch` — el candado primero, el INSERT despues, ya con la
 * foto tomada bajo el candado. Eso solo se puede comprobar contra Postgres de verdad y con
 * llamadas que de verdad se pisen, por eso esta prueba lanza los repartos con `Promise.all`.
 *
 * Cada prueba crea su propio alumno, con nombres marcados, y todo se borra al terminar — incluso
 * si una prueba falla. No dependen de los datos sembrados ni los ensucian.
 *
 * Una nota sobre las actividades de prueba: se crean `cerrada`, con el cierre de marcaje una
 * hora atras. Asi el corte de reparto (48 h despues del ultimo cierre, §5) queda abierto sin
 * importar el estado de los datos reales, y no se mueve a futuro para nadie. Duran segundos.
 */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { config } from "dotenv";
import { and, eq, like } from "drizzle-orm";

config({ path: ".env.local" });

const { db } = await import("../src/db/cliente.ts");
const { actividad, alumno, asignacionExtra, asistencia, bitacora, clase, inscripcion } = await import(
  "../src/db/esquema/index.ts"
);
const { repartirPuntos } = await import("../src/lib/puntos/consulta.ts");
const { generarSecreto } = await import("../src/lib/qr/codigo.ts");

const MARCA = "zzz-prueba-puntos";
const AHORA = new Date();
const enHoras = (h: number) => new Date(AHORA.getTime() + h * 3600_000);
const PUNTOS_POR_ACTIVIDAD = 2;
const RONDAS_DE_CARRERA = 5;

let idClaseA = "";
let idClaseB = "";
let contador = 0;

/**
 * Borra SOLO lo que lleva la marca. La base es la de produccion y trae datos reales de
 * alumnos: cada `where` de aqui abajo esta acotado por un id que salio de una fila marcada.
 * Nunca se borra por una condicion que pueda alcanzar filas ajenas.
 */
async function limpiar() {
  // 1. Alumnos de prueba (por correo marcado) y todo lo que cuelga de ellos.
  const alumnos = await db.select({ id: alumno.id }).from(alumno).where(like(alumno.email, `${MARCA}%`));
  for (const { id } of alumnos) {
    await db.delete(asignacionExtra).where(eq(asignacionExtra.alumnoId, id));
    await db.delete(asistencia).where(eq(asistencia.alumnoId, id));
    await db.delete(inscripcion).where(eq(inscripcion.alumnoId, id));
    await db.delete(bitacora).where(eq(bitacora.alumnoId, id));
    await db.delete(alumno).where(eq(alumno.id, id));
  }
  // 2. Actividades de prueba (por nombre marcado).
  const actividades = await db.select({ id: actividad.id }).from(actividad).where(like(actividad.nombre, `${MARCA}%`));
  for (const { id } of actividades) {
    await db.delete(asignacionExtra).where(eq(asignacionExtra.actividadId, id));
    await db.delete(asistencia).where(eq(asistencia.actividadId, id));
    await db.delete(bitacora).where(eq(bitacora.actividadId, id));
    await db.delete(actividad).where(eq(actividad.id, id));
  }
  // 3. Clases de prueba (por nombre marcado).
  const clases = await db.select({ id: clase.id }).from(clase).where(like(clase.nombre, `${MARCA}%`));
  for (const { id } of clases) {
    await db.delete(asignacionExtra).where(eq(asignacionExtra.claseId, id));
    await db.delete(inscripcion).where(eq(inscripcion.claseId, id));
    await db.delete(clase).where(eq(clase.id, id));
  }
}

async function nuevaClase(sufijo: string) {
  const [creada] = await db
    .insert(clase)
    .values({
      codigo: `${MARCA}-${sufijo}`,
      nombre: `${MARCA} clase ${sufijo}`,
      jornada: "zzz",
      ciclo: "1",
    })
    .returning({ id: clase.id });
  return creada.id;
}

/** Un alumno nuevo por prueba: asi ninguna hereda saldo ni repartos de otra. */
async function nuevoAlumno(inscritoEn: string[] = [idClaseA]) {
  contador += 1;
  const id = `${MARCA}-alumno-${contador}`;
  await db.insert(alumno).values({
    id,
    email: `${MARCA}-${contador}@ronda.test`,
    carne: `${MARCA}-carne-${contador}`,
    nombre: "Alumno de prueba",
    ciclo: "1",
    perfilCompleto: true,
  });
  for (const claseId of inscritoEn) {
    await db.insert(inscripcion).values({ alumnoId: id, claseId });
  }
  return id;
}

/**
 * Le da al alumno `n` actividades extra de 2 puntos con asistencia registrada. `iniciaEn`
 * crece con el indice, asi que la 0 es la mas antigua (de donde el reparto consume primero).
 */
async function darSaldo(alumnoId: string, n: number) {
  const ids: string[] = [];
  for (let i = 0; i < n; i++) {
    const [creada] = await db
      .insert(actividad)
      .values({
        codigoCorto: `zp${Math.random().toString(36).slice(2, 8)}`,
        nombre: `${MARCA} extra ${alumnoId} #${i}`,
        tipo: "extra",
        puntos: PUNTOS_POR_ACTIVIDAD,
        iniciaEn: enHoras(-10 + i),
        terminaEn: enHoras(-9 + i),
        marcajeAbreEn: enHoras(-10 + i),
        marcajeCierraEn: enHoras(-1),
        estado: "cerrada",
        secretoQr: generarSecreto(),
      })
      .returning({ id: actividad.id });
    await db.insert(asistencia).values({
      alumnoId,
      actividadId: creada.id,
      slot: BigInt(0),
      origen: "manual",
      notaManual: MARCA,
    });
    ids.push(creada.id);
  }
  return ids;
}

const asignacionesDe = (alumnoId: string) =>
  db
    .select({ actividadId: asignacionExtra.actividadId, claseId: asignacionExtra.claseId, puntos: asignacionExtra.puntos })
    .from(asignacionExtra)
    .where(eq(asignacionExtra.alumnoId, alumnoId));

const sumar = (filas: { puntos: number }[]) => filas.reduce((s, f) => s + f.puntos, 0);

before(async () => {
  await limpiar();
  idClaseA = await nuevaClase("A");
  idClaseB = await nuevaClase("B");
});

after(limpiar);

test("un reparto simple dentro del saldo se guarda", async () => {
  const alumnoId = await nuevoAlumno();
  const [actividadId] = await darSaldo(alumnoId, 1);

  const r = await repartirPuntos(alumnoId, idClaseA, 1);
  assert.deepEqual(r, { ok: true });

  const filas = await asignacionesDe(alumnoId);
  assert.equal(filas.length, 1);
  assert.deepEqual(filas[0], { actividadId, claseId: idClaseA, puntos: 1 });

  // Lo que queda sigue siendo repartible (el saldo bajo de 2 a 1, no a 0), y con el saldo en
  // cero ya no sale ni un punto mas.
  assert.deepEqual(await repartirPuntos(alumnoId, idClaseA, 1), { ok: true });
  const rechazado = await repartirPuntos(alumnoId, idClaseA, 1);
  assert.equal(rechazado.ok, false, "con el saldo en cero, un punto mas no puede salir");
  assert.equal(sumar(await asignacionesDe(alumnoId)), PUNTOS_POR_ACTIVIDAD);
});

test("CARRERA: dos repartos simultaneos que juntos pasan el saldo, solo uno entra", async () => {
  for (let ronda = 1; ronda <= RONDAS_DE_CARRERA; ronda++) {
    const alumnoId = await nuevoAlumno();
    await darSaldo(alumnoId, 1); // gana N = 2 puntos
    const ganado = PUNTOS_POR_ACTIVIDAD;

    // Los dos piden TODO el saldo. Cada uno, por separado, es valido; juntos, no.
    const [a, b] = await Promise.all([
      repartirPuntos(alumnoId, idClaseA, ganado),
      repartirPuntos(alumnoId, idClaseA, ganado),
    ]);

    const exitos = [a, b].filter((r) => r.ok).length;
    const total = sumar(await asignacionesDe(alumnoId));

    // Lo importante primero: nunca mas de lo ganado. Antes del arreglo esto daba saldo negativo.
    assert.ok(total <= ganado, `ronda ${ronda}: se repartieron ${total} puntos y solo se ganaron ${ganado} (saldo negativo)`);
    assert.equal(exitos, 1, `ronda ${ronda}: debia entrar exactamente un reparto y entraron ${exitos}`);
    assert.equal(total, ganado, `ronda ${ronda}: el reparto que entro debia dejar ${ganado} puntos y dejo ${total}`);

    const perdedor = a.ok ? b : a;
    assert.ok(!perdedor.ok);
    // Sea porque el segundo ya vio el saldo gastado al leer, o porque el INSERT bajo candado
    // lo rechazo, el mensaje habla del saldo.
    assert.match(perdedor.error, /saldo/i, `ronda ${ronda}: el error del perdedor no habla del saldo: ${perdedor.error}`);
  }
});

test("todo o nada: un reparto que abarca dos actividades escribe las dos", async () => {
  // 3 puntos con saldo 2 + 2: salen 2 de la mas antigua y 1 de la siguiente.
  const alumnoId = await nuevoAlumno();
  const [primera, segunda] = await darSaldo(alumnoId, 2);

  assert.deepEqual(await repartirPuntos(alumnoId, idClaseA, 3), { ok: true });
  const filas = await asignacionesDe(alumnoId);
  assert.equal(filas.length, 2, "un reparto que abarca dos actividades deja una fila en cada una");
  const porActividad = new Map(filas.map((f) => [f.actividadId, f.puntos]));
  assert.equal(porActividad.get(primera), 2);
  assert.equal(porActividad.get(segunda), 1);
});

test("todo o nada bajo carrera: el reparto perdedor no deja ni una fila", async () => {
  for (let ronda = 1; ronda <= RONDAS_DE_CARRERA; ronda++) {
    const alumnoId = await nuevoAlumno();
    const actividades = await darSaldo(alumnoId, 2); // 4 puntos en total, 2 por actividad

    // Cada uno pide 3, que abarca las dos actividades. Solo cabe uno (3 + 3 > 4).
    const [a, b] = await Promise.all([
      repartirPuntos(alumnoId, idClaseA, 3),
      repartirPuntos(alumnoId, idClaseA, 3),
    ]);
    assert.equal([a, b].filter((r) => r.ok).length, 1, `ronda ${ronda}: debia entrar exactamente un reparto`);

    const filas = await asignacionesDe(alumnoId);
    // Si el perdedor hubiera escrito una de sus dos filas, habria mas de 2 filas o mas de 3 puntos.
    assert.equal(filas.length, 2, `ronda ${ronda}: deberian ser las 2 filas del ganador y hay ${filas.length}`);
    assert.equal(sumar(filas), 3, `ronda ${ronda}: deberian ser 3 puntos y hay ${sumar(filas)}`);
    for (const id of actividades) {
      const deEsa = sumar(filas.filter((f) => f.actividadId === id));
      assert.ok(
        deEsa <= PUNTOS_POR_ACTIVIDAD,
        `ronda ${ronda}: una actividad quedo con ${deEsa} repartidos y solo da ${PUNTOS_POR_ACTIVIDAD}`,
      );
    }
  }
});

test("repartir hacia una clase en la que no esta inscrito se rechaza y no escribe nada", async () => {
  const alumnoId = await nuevoAlumno([idClaseA]); // inscrito en A, NO en B
  await darSaldo(alumnoId, 1);

  const r = await repartirPuntos(alumnoId, idClaseB, 1);
  assert.equal(r.ok, false);
  assert.ok(!r.ok && /inscrit/i.test(r.error), "el error debe decir que no esta inscrito");
  assert.equal((await asignacionesDe(alumnoId)).length, 0, "no debe haberse escrito ninguna fila");

  // El rechazo no dejo nada a medias: hacia la clase donde si esta inscrito, el reparto sale.
  assert.deepEqual(await repartirPuntos(alumnoId, idClaseA, 1), { ok: true });
  const guardadas = await db
    .select({ id: asignacionExtra.id })
    .from(asignacionExtra)
    .where(and(eq(asignacionExtra.alumnoId, alumnoId), eq(asignacionExtra.claseId, idClaseA)));
  assert.equal(guardadas.length, 1);
});
