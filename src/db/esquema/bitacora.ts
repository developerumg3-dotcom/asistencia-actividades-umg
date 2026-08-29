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
});
