import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const docente = pgTable("docente", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: text("nombre").notNull(),
  email: text("email").notNull(),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
});
