import { sql } from "drizzle-orm";
import { actividad, asistencia } from "@/db/esquema";

/**
 * Una asistencia solo da puntos si esta completa: en una actividad de doble marcaje tiene que
 * tener tambien la salida (PLANIFICACION.md §5 y §6.5). Una de un solo marcaje siempre lo
 * esta. Requiere que la consulta junte `asistencia` con `actividad`.
 */
export const asistenciaCompleta = sql`(${actividad.dobleMarcaje} = false or ${asistencia.salidaEn} is not null)`;
