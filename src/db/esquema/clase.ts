import { boolean, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { docente } from "./docente";

export const clase = pgTable("clase", {
  id: uuid("id").primaryKey().defaultRandom(),
  codigo: text("codigo").notNull(),
  nombre: text("nombre").notNull(),
  docenteId: uuid("docente_id")
    .notNull()
    .references(() => docente.id),
  seccion: text("seccion").notNull(),
  jornada: text("jornada").notNull(),
  ciclo: text("ciclo").notNull(),
  activa: boolean("activa").notNull().default(true),
});
