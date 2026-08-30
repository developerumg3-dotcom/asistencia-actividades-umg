/*
 * Siembra actividades y asistencias de prueba para poder ver /participaciones y
 * /puntos-extra funcionando de verdad, sin esperar a que la Fase 2 (B4, A6/A7) este lista.
 *
 *     pnpm db:sembrar-actividades
 *
 * Requiere haber corrido antes `pnpm db:sembrar-usuarios` (ver ese script): usa el alumno
 * `alumno@ronda.test`, ya inscrito en los cursos 031 a 035.
 *
 * Reproduce el ejemplo trabajado de PLANIFICACION.md §5: 5 actividades globales de 1 punto,
 * el alumno asiste a 3, mas una actividad extra de 2 puntos a la que tambien asiste. El
 * saldo de esos 2 puntos queda **sin repartir a proposito**, para poder probar el reparto y
 * el deshacer desde la pantalla real.
 *
 * Idempotente: correrlo de nuevo no duplica nada.
 *
 * Borrado:
 *   delete from asistencia where alumno_id in (select id from alumno where email = 'alumno@ronda.test');
 *   delete from asignacion_extra where alumno_id in (select id from alumno where email = 'alumno@ronda.test');
 *   delete from actividad where codigo_corto like 'demo-%';
 */
import { config } from "dotenv";
import { eq } from "drizzle-orm";

config({ path: ".env.local" });

const { db } = await import("../src/db/cliente.ts");
const { actividad, alumno, asistencia } = await import("../src/db/esquema/index.ts");
const { generarSecreto, slotDe } = await import("../src/lib/qr/codigo.ts");

const CORREO_ALUMNO = "alumno@ronda.test";
const VENTANA_SEG = 60;

const AHORA = Date.now();
const horasAtras = (h: number) => new Date(AHORA - h * 60 * 60 * 1000);

type ActividadSembrada = {
  codigoCorto: string;
  nombre: string;
  tipo: "global" | "extra";
  puntos: number;
  /** Horas atras del inicio. Espaciadas para que el orden cronologico sea claro. */
  horasAtrasInicio: number;
  /** Si el alumno de prueba marco asistencia en esta actividad. */
  asiste: boolean;
};

const ACTIVIDADES: ActividadSembrada[] = [
  { codigoCorto: "demo-1", nombre: "Charla de bienvenida", tipo: "global", puntos: 1, horasAtrasInicio: 240, asiste: true },
  { codigoCorto: "demo-2", nombre: "Taller de Git", tipo: "global", puntos: 1, horasAtrasInicio: 192, asiste: true },
  { codigoCorto: "demo-3", nombre: "Conferencia de seguridad", tipo: "global", puntos: 1, horasAtrasInicio: 144, asiste: true },
  { codigoCorto: "demo-4", nombre: "Feria de proyectos", tipo: "global", puntos: 1, horasAtrasInicio: 96, asiste: false },
  { codigoCorto: "demo-5", nombre: "Cierre de ciclo", tipo: "global", puntos: 1, horasAtrasInicio: 48, asiste: false },
  { codigoCorto: "demo-x", nombre: "Feria Tecnológica", tipo: "extra", puntos: 2, horasAtrasInicio: 72, asiste: true },
];

const [alumnoFila] = await db.select().from(alumno).where(eq(alumno.email, CORREO_ALUMNO)).limit(1);
if (!alumnoFila) {
  console.error(`No existe ${CORREO_ALUMNO}. Corré primero: pnpm db:sembrar-usuarios`);
  process.exit(1);
}

let creadas = 0;
let asistenciasNuevas = 0;

for (const def of ACTIVIDADES) {
  const inicia = horasAtras(def.horasAtrasInicio);
  const termina = horasAtras(def.horasAtrasInicio - 2);
  const marcajeAbre = inicia;
  const marcajeCierra = horasAtras(def.horasAtrasInicio - 24);

  let [fila] = await db.select().from(actividad).where(eq(actividad.codigoCorto, def.codigoCorto)).limit(1);
  if (!fila) {
    [fila] = await db
      .insert(actividad)
      .values({
        codigoCorto: def.codigoCorto,
        nombre: def.nombre,
        descripcion: null,
        lugar: "Salón de prueba",
        tipo: def.tipo,
        puntos: def.puntos,
        iniciaEn: inicia,
        terminaEn: termina,
        marcajeAbreEn: marcajeAbre,
        marcajeCierraEn: marcajeCierra,
        estado: "publicada",
        secretoQr: generarSecreto(),
        ventanaSeg: VENTANA_SEG,
      })
      .returning();
    creadas++;
  }

  if (def.asiste && fila) {
    const [yaMarco] = await db
      .select({ id: asistencia.id })
      .from(asistencia)
      .where(eq(asistencia.actividadId, fila.id))
      .limit(1);
    if (!yaMarco) {
      await db.insert(asistencia).values({
        alumnoId: alumnoFila.id,
        actividadId: fila.id,
        marcadaEn: marcajeAbre,
        slot: BigInt(slotDe(marcajeAbre, VENTANA_SEG)),
        origen: "manual",
        notaManual: "Sembrado de prueba (Fase 3, ver docs/fase-3.md)",
      });
      asistenciasNuevas++;
    }
  }
}

console.log(`Listo. ${creadas} actividades nuevas, ${asistenciasNuevas} asistencias nuevas.`);
console.log(`Alumno de prueba: ${CORREO_ALUMNO} — revisá /participaciones y /puntos-extra.`);
