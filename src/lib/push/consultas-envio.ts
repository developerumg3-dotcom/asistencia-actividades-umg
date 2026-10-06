import { sql } from "drizzle-orm";
import type { Aviso } from "./aviso";

export function claveAvisoActividad(actividadId: string, reenvio?: string) {
  return `actividad:${actividadId.toLowerCase()}:${reenvio?.toLowerCase() ?? "inicial"}`;
}

export function candadoAviso(clave: string) {
  return sql`SELECT pg_advisory_xact_lock(hashtextextended(${`push:${clave}`}, 0))`;
}

/** Se ejecuta DESPUES del candado, como otra sentencia del batch. */
export function crearAvisoActividad(clave: string, actividadId: string, autorId: string, aviso: Aviso) {
  return sql`
    WITH nuevo AS (
      INSERT INTO aviso_push (clave, tipo, autor_id, actividad_id, titulo, cuerpo, url)
      SELECT ${clave}, 'actividad', ${autorId}, id, ${aviso.titulo}, ${aviso.cuerpo}, ${aviso.url}
      FROM actividad WHERE id = ${actividadId}::uuid AND estado = 'publicada'
      ON CONFLICT (clave) DO NOTHING RETURNING id
    )
    INSERT INTO entrega_push (aviso_id, suscripcion_id, alumno_id)
    SELECT n.id, s.id, s.alumno_id FROM nuevo n CROSS JOIN suscripcion_push s
    JOIN alumno a ON a.id = s.alumno_id WHERE a.estado = 'activo'
    ON CONFLICT (aviso_id, suscripcion_id) DO NOTHING
  `;
}

export function reservarEntregas(avisoId: string) {
  return sql`
    WITH elegidas AS (
      SELECT e.id FROM entrega_push e
      JOIN aviso_push n ON n.id = e.aviso_id
      JOIN suscripcion_push s ON s.id = e.suscripcion_id AND s.alumno_id = e.alumno_id
      JOIN alumno a ON a.id = e.alumno_id
      WHERE e.aviso_id = ${avisoId}::uuid AND a.estado = 'activo'
        AND n.cancelada_en IS NULL AND (n.programada_en IS NULL OR n.programada_en <= now())
        AND e.intentos < 3 AND (e.estado = 'pendiente' OR
          (e.estado = 'fallida' AND e.reintentar_en IS NOT NULL AND e.reintentar_en <= now()))
      ORDER BY e.id LIMIT 20 FOR UPDATE OF e SKIP LOCKED
    ), reservadas AS (
      UPDATE entrega_push e SET estado = 'procesando', intentos = intentos + 1,
        reservada_en = now(), reintentar_en = NULL
      FROM elegidas WHERE e.id = elegidas.id RETURNING e.*
    )
    SELECT e.id, e.intentos, e.alumno_id AS "alumnoId", s.id AS "suscripcionId",
      s.endpoint, s.p256dh, s.auth
    FROM reservadas e JOIN suscripcion_push s
      ON s.id = e.suscripcion_id AND s.alumno_id = e.alumno_id
  `;
}

/** Una suscripcion eliminada/reasignada o alumno inactivo no queda pendiente para siempre. */
export function descartarDestinatariosInactivos(avisoId: string) {
  return sql`
    UPDATE entrega_push e SET estado = 'descartada', reintentar_en = NULL
    WHERE e.aviso_id = ${avisoId}::uuid AND e.estado IN ('pendiente', 'fallida')
      AND NOT EXISTS (
        SELECT 1 FROM suscripcion_push s JOIN alumno a ON a.id = s.alumno_id
        WHERE s.id = e.suscripcion_id AND s.alumno_id = e.alumno_id AND a.estado = 'activo'
      )
  `;
}
