import { sql } from "drizzle-orm";

/** UUID de clase; el id de Neon Auth es texto y no se valida con esta regla. */
export function esIdDeClase(valor: unknown): valor is string {
  return typeof valor === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(valor);
}

/** Una sentencia: la fila de clase queda bloqueada contra desactivacion hasta insertar. */
export function consultaInscripcionActiva(alumnoId: string, claseId: string) {
  return sql`
    WITH elegida AS MATERIALIZED (
      SELECT id FROM clase WHERE id = ${claseId}::uuid AND activa = true FOR SHARE
    ), creada AS (
      INSERT INTO inscripcion (alumno_id, clase_id)
      SELECT ${alumnoId}, id FROM elegida
      ON CONFLICT (alumno_id, clase_id) DO NOTHING
      RETURNING id
    )
    SELECT EXISTS (SELECT 1 FROM elegida) AS disponible
  `;
}
