import { inet, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { actividad } from "./actividad";
import { alumno } from "./alumno";
import { eventoBitacoraEnum, resultadoBitacoraEnum } from "./enums";

export const bitacora = pgTable("bitacora", {
  id: uuid("id").primaryKey().defaultRandom(),
  alumnoId: text("alumno_id")
    .notNull()
    .references(() => alumno.id),
  actividadId: uuid("actividad_id").references(() => actividad.id),
  evento: eventoBitacoraEnum("evento").notNull(),
  resultado: resultadoBitacoraEnum("resultado"),
  ocurrioEn: timestamp("ocurrio_en", { withTimezone: true }).notNull().defaultNow(),
  ip: inet("ip"),
  dispositivoId: text("dispositivo_id"),
  // Fase 4: campo libre de contexto. Guarda el carné liberado (`carne_liberado`) o quién de
  // administración corrigió una inscripción ajena (`inscripcion_creada`/`inscripcion_eliminada`
  // disparados desde /admin/alumnos en vez de por el propio alumno).
  detalle: text("detalle"),
});
