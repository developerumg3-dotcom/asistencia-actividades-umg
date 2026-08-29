import { pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { alumno } from "./alumno";
import { clase } from "./clase";

export const inscripcion = pgTable(
  "inscripcion",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    alumnoId: text("alumno_id")
      .notNull()
      .references(() => alumno.id),
    claseId: uuid("clase_id")
      .notNull()
      .references(() => clase.id),
    inscritoEn: timestamp("inscrito_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (tabla) => [unique().on(tabla.alumnoId, tabla.claseId)],
);
