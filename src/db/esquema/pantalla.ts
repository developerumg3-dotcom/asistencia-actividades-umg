import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { actividad } from "./actividad";

export const pantalla = pgTable("pantalla", {
  id: uuid("id").primaryKey().defaultRandom(),
  actividadId: uuid("actividad_id")
    .notNull()
    .references(() => actividad.id),
  clave: text("clave").notNull().unique(),
  creadaEn: timestamp("creada_en", { withTimezone: true }).notNull().defaultNow(),
  activa: boolean("activa").notNull().default(true),
});
