import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { estadoActividadEnum, tipoActividadEnum } from "./enums";
import { bytea } from "./tipos";

export const actividad = pgTable("actividad", {
  id: uuid("id").primaryKey().defaultRandom(),
  codigoCorto: text("codigo_corto").notNull().unique(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  lugar: text("lugar"),
  tipo: tipoActividadEnum("tipo").notNull(),
  puntos: integer("puntos").notNull(),
  iniciaEn: timestamp("inicia_en", { withTimezone: true }).notNull(),
  terminaEn: timestamp("termina_en", { withTimezone: true }).notNull(),
  marcajeAbreEn: timestamp("marcaje_abre_en", { withTimezone: true }).notNull(),
  marcajeCierraEn: timestamp("marcaje_cierra_en", { withTimezone: true }).notNull(),
  estado: estadoActividadEnum("estado").notNull().default("borrador"),
  secretoQr: bytea("secreto_qr").notNull(),
  ventanaSeg: integer("ventana_seg").notNull().default(60),
});
