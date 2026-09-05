/*
 * Deja la base de datos "de cero": borra todos los datos operativos y de prueba, y conserva
 * solo las tablas de config (`alumno` y `clase`, con `clase.docente_id` puesto a null porque
 * los catedraticos se borran).
 *
 * Se borra por completo: docente, actividad, asistencia, asignacion_extra, inscripcion,
 * bitacora, pantalla.
 * Se conserva por completo: alumno, clase.
 *
 *     pnpm db:limpiar
 *
 * Orden de borrado: primero lo que tiene llave foranea hacia otras tablas (pantalla,
 * bitacora, asignacion_extra, asistencia, inscripcion), luego actividad, y al final docente
 * (despues de desvincularlo de clase). Ver las FK en src/db/migraciones/0000_organic_dreadnoughts.sql.
 *
 * No hay confirmacion interactiva: es un script destructivo, se corre a proposito.
 */
import { config } from "dotenv";
import { isNotNull } from "drizzle-orm";

config({ path: ".env.local" });

const { db } = await import("../src/db/cliente.ts");
const {
  actividad,
  asignacionExtra,
  asistencia,
  bitacora,
  clase,
  docente,
  inscripcion,
  pantalla,
} = await import("../src/db/esquema/index.ts");

// db.transaction no existe en el driver neon-http (lanza "No transactions support"); db.batch
// sí, porque manda todas las sentencias en una sola llamada HTTP dentro de una transaccion real.
await db.batch([
  db.update(clase).set({ docenteId: null }).where(isNotNull(clase.docenteId)),
  db.delete(pantalla),
  db.delete(bitacora),
  db.delete(asignacionExtra),
  db.delete(asistencia),
  db.delete(inscripcion),
  db.delete(actividad),
  db.delete(docente),
]);

console.log("Base de datos limpia: solo quedan alumno y clase (sin docente asignado).");
