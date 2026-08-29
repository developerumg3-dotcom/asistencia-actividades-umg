import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { estadoAlumnoEnum, rolEnum } from "./enums";

// El id es igual al que genera Neon Auth (Managed Better Auth) para el usuario. No se
// garantiza que sea un uuid válido, por eso es texto. Ver PLANIFICACION.md §4.
export const alumno = pgTable("alumno", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  carne: text("carne").unique(),
  nombre: text("nombre"),
  rol: rolEnum("rol").notNull().default("alumno"),
  estado: estadoAlumnoEnum("estado").notNull().default("activo"),
  perfilCompleto: boolean("perfil_completo").notNull().default(false),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
});
