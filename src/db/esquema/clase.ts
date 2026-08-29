import { boolean, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { docente } from "./docente";

export const clase = pgTable("clase", {
  id: uuid("id").primaryKey().defaultRandom(),
  codigo: text("codigo").notNull(),
  nombre: text("nombre").notNull(),
  // Nulo permitido: el catalogo se siembra con el pensum completo, antes de saber quien
  // imparte cada curso y en que seccion. Ver PLANIFICACION.md §4 (`clase`).
  docenteId: uuid("docente_id").references(() => docente.id),
  seccion: text("seccion"),
  jornada: text("jornada").notNull(),
  ciclo: text("ciclo").notNull(),
  activa: boolean("activa").notNull().default(true),
});
