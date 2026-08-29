import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { actividad } from "./actividad";
import { alumno } from "./alumno";
import { clase } from "./clase";

export const asignacionExtra = pgTable("asignacion_extra", {
  id: uuid("id").primaryKey().defaultRandom(),
  alumnoId: text("alumno_id")
    .notNull()
    .references(() => alumno.id),
  actividadId: uuid("actividad_id")
    .notNull()
    .references(() => actividad.id),
  claseId: uuid("clase_id")
    .notNull()
    .references(() => clase.id),
  puntos: integer("puntos").notNull(),
  creadaEn: timestamp("creada_en", { withTimezone: true }).notNull().defaultNow(),
});
