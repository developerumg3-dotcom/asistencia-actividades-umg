/*
 * Pruebas de integracion de la geolocalizacion. Tocan la base.
 *
 *     pnpm probar:base
 *
 * Lo que se verifica es sobre todo lo que NO pasa. Sin `exigeUbicacion`, que ninguna
 * ubicacion —ni la mas lejana— impida marcar. Con `exigeUbicacion`, que lo unico que
 * bloquea sea una lectura BUENA que caiga lejos: negar el permiso o dar una lectura
 * imprecisa siguen dejando marcar, porque eso seria quitarle el punto a un alumno que si
 * fue por culpa de su telefono. Ver docs/plan-geolocalizacion.md.
 */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { config } from "dotenv";
import { and, eq, like } from "drizzle-orm";

config({ path: ".env.local" });

const { db } = await import("../src/db/cliente.ts");
const { actividad, alumno, asistencia, bitacora, inscripcion } = await import(
  "../src/db/esquema/index.ts"
);
const { registrarMarcaje } = await import("../src/lib/qr/marcaje.ts");
const { codigoVigente, generarSecreto } = await import("../src/lib/qr/codigo.ts");

const MARCA = "zzz-prueba-geo";
const SECRETO = generarSecreto();
const VENTANA = 60;
const AHORA = new Date();

/** Enchulados, coordenadas exactas de Google Maps. */
const ENCHULADOS = { lat: 14.308601, lon: -90.786206 };
/** Radio sugerido. La zona se declara por actividad: Enchulados es el habitual, no el unico. */
const RADIO = 200;
const LEJOS = { lat: 14.6349, lon: -90.5069 }; // Ciudad de Guatemala, ~50 km

let idActividad = "";
let codigoCorto = "";
const idAlumno = `${MARCA}-alumno`;

async function limpiar() {
  const acts = await db.select({ id: actividad.id }).from(actividad).where(like(actividad.nombre, `${MARCA}%`));
  for (const { id } of acts) {
    await db.delete(bitacora).where(eq(bitacora.actividadId, id));
    await db.delete(asistencia).where(eq(asistencia.actividadId, id));
    await db.delete(actividad).where(eq(actividad.id, id));
  }
  const als = await db.select({ id: alumno.id }).from(alumno).where(like(alumno.email, `${MARCA}%`));
  for (const { id } of als) {
    await db.delete(bitacora).where(eq(bitacora.alumnoId, id));
    await db.delete(inscripcion).where(eq(inscripcion.alumnoId, id));
    await db.delete(alumno).where(eq(alumno.id, id));
  }
}

/** Cada prueba estrena actividad, porque un alumno solo puede marcar una vez en cada una. */
async function nuevaActividad(conZona: boolean, exigeUbicacion = false) {
  codigoCorto = `zg${Math.floor(Math.random() * 900 + 100)}`;
  const [creada] = await db
    .insert(actividad)
    .values({
      codigoCorto,
      nombre: `${MARCA} ${conZona ? "con" : "sin"} zona ${exigeUbicacion ? "exigida " : ""}${codigoCorto}`,
      tipo: "global",
      puntos: 1,
      iniciaEn: AHORA,
      terminaEn: new Date(AHORA.getTime() + 7200_000),
      marcajeAbreEn: new Date(AHORA.getTime() - 3600_000),
      marcajeCierraEn: new Date(AHORA.getTime() + 86400_000),
      estado: "publicada",
      ventanaSeg: VENTANA,
      secretoQr: SECRETO,
      lat: conZona ? ENCHULADOS.lat : null,
      lon: conZona ? ENCHULADOS.lon : null,
      radioM: conZona ? RADIO : null,
      exigeUbicacion,
    })
    .returning({ id: actividad.id });
  idActividad = creada.id;
  return creada.id;
}

/** Los resultados que quedaron en bitacora para esta actividad, en orden de llegada. */
async function anotados(actividadId: string) {
  const filas = await db
    .select({ resultado: bitacora.resultado })
    .from(bitacora)
    .where(and(eq(bitacora.alumnoId, idAlumno), eq(bitacora.actividadId, actividadId)))
    .orderBy(bitacora.ocurrioEn);
  return filas.map((f) => f.resultado);
}

async function guardada(actividadId: string) {
  const [fila] = await db
    .select({
      lat: asistencia.lat,
      lon: asistencia.lon,
      precisionM: asistencia.precisionM,
      distanciaM: asistencia.distanciaM,
    })
    .from(asistencia)
    .where(and(eq(asistencia.alumnoId, idAlumno), eq(asistencia.actividadId, actividadId)))
    .limit(1);
  return fila;
}

before(async () => {
  await limpiar();
  await db.insert(alumno).values({
    id: idAlumno,
    email: `${MARCA}@ronda.test`,
    carne: `${MARCA}-carne`,
    nombre: "Alumno geo",
    ciclo: "7",
    perfilCompleto: true,
  });
});

after(limpiar);

const marcar = (ubicacion: { lat: number; lon: number; precisionM: number | null } | null) =>
  registrarMarcaje({
    alumno: { id: idAlumno, perfilCompleto: true },
    codigoCorto,
    codigo: codigoVigente(SECRETO, idActividad, VENTANA, AHORA),
    momento: AHORA,
    ubicacion,
  });

test("dentro de la zona: se guarda la distancia", async () => {
  const id = await nuevaActividad(true);
  const r = await marcar({ lat: ENCHULADOS.lat, lon: ENCHULADOS.lon, precisionM: 12 });
  assert.equal(r.resultado, "ok");
  const fila = await guardada(id);
  assert.equal(fila.distanciaM, 0);
  assert.equal(fila.precisionM, 12);
});

test("A CINCUENTA KILOMETROS TAMBIEN MARCA — sin exigeUbicacion nada bloquea", async () => {
  const id = await nuevaActividad(true);
  const r = await marcar({ ...LEJOS, precisionM: 10 });
  assert.equal(
    r.resultado,
    "ok",
    "con la zona declarada pero sin exigirla, estar lejos NO puede impedir marcar",
  );
  const fila = await guardada(id);
  assert.ok(fila.distanciaM !== null && fila.distanciaM > 40_000, `distancia ${fila.distanciaM}`);
});

test("sin ubicacion marca igual y queda en nulo", async () => {
  const id = await nuevaActividad(true);
  const r = await marcar(null);
  assert.equal(r.resultado, "ok", "negar el permiso NO puede impedir marcar");
  const fila = await guardada(id);
  assert.equal(fila.lat, null);
  assert.equal(fila.distanciaM, null);
});

test("una actividad sin zona no calcula distancia aunque llegue la ubicacion", async () => {
  const id = await nuevaActividad(false);
  const r = await marcar({ lat: ENCHULADOS.lat, lon: ENCHULADOS.lon, precisionM: 8 });
  assert.equal(r.resultado, "ok");
  const fila = await guardada(id);
  assert.equal(fila.lat, ENCHULADOS.lat, "la lectura se guarda igual");
  assert.equal(fila.distanciaM, null, "pero sin zona no hay distancia que calcular");
});

test("una lectura basura no se guarda como si fuera real", async () => {
  const id = await nuevaActividad(true);
  const r = await marcar({ lat: 0, lon: 0, precisionM: 5 });
  assert.equal(r.resultado, "ok");
  const fila = await guardada(id);
  assert.equal(fila.lat, null, "(0,0) es el punto nulo, no una posicion");
  assert.equal(fila.distanciaM, null);
});

/*
 * Etapa 2: `exigeUbicacion` en true. Una sola de las cuatro combinaciones rechaza.
 */

test("exigiendo ubicacion, lejos y con buena lectura: se rechaza", async () => {
  const id = await nuevaActividad(true, true);
  const r = await marcar({ ...LEJOS, precisionM: 10 });
  assert.equal(r.resultado, "fuera_de_zona");
  assert.equal(await guardada(id), undefined, "no puede quedar asistencia de un rechazo");
  assert.deepEqual(await anotados(id), ["fuera_de_zona"], "pero el intento si va a bitacora");
});

test("exigiendo ubicacion, sin ubicacion: marca igual", async () => {
  const id = await nuevaActividad(true, true);
  const r = await marcar(null);
  assert.equal(
    r.resultado,
    "ok",
    "negar el permiso no puede convertirse en un requisito para tener puntos",
  );
  const fila = await guardada(id);
  assert.equal(fila.distanciaM, null);
});

test("exigiendo ubicacion, lectura mas imprecisa que el radio: marca igual", async () => {
  const id = await nuevaActividad(true, true);
  // A 50 km, pero con ±500 m de error sobre un radio de 200: la medicion no alcanza para
  // afirmar nada, y rechazar seria castigarlo por su telefono.
  const r = await marcar({ ...LEJOS, precisionM: 500 });
  assert.equal(r.resultado, "ok");
  const fila = await guardada(id);
  assert.ok(fila.distanciaM !== null && fila.distanciaM > 40_000, "la distancia igual se guarda");
  assert.equal(fila.precisionM, 500, "y la precision tambien, para poder revisarlo a mano");
});

test("exigiendo ubicacion, dentro de la zona: marca normal", async () => {
  const id = await nuevaActividad(true, true);
  const r = await marcar({ lat: ENCHULADOS.lat, lon: ENCHULADOS.lon, precisionM: 12 });
  assert.equal(r.resultado, "ok");
  assert.equal((await guardada(id)).distanciaM, 0);
});

test("una actividad sin zona no bloquea aunque exija ubicacion", async () => {
  // Combinacion que la interfaz no deja guardar (`leerZona` apaga la casilla si no hay
  // zona), pero el bloqueo no puede depender de eso: sin centro no hay nada contra que
  // comparar, y lo que no se puede afirmar no se rechaza.
  const id = await nuevaActividad(false, true);
  const r = await marcar({ ...LEJOS, precisionM: 10 });
  assert.equal(r.resultado, "ok");
  assert.equal((await guardada(id)).distanciaM, null);
});
