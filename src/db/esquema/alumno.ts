import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { estadoAlumnoEnum, rolEnum } from "./enums";

// El id es igual al que genera Neon Auth (Managed Better Auth) para el usuario. No se
// garantiza que sea un uuid válido, por eso es texto. Ver PLANIFICACION.md §4.
export const alumno = pgTable("alumno", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  carne: text("carne").unique(),
  nombre: text("nombre"),
  // Ciclo que cursa, "1" a "10". Solo sirve para arrancar A4 filtrada en su ciclo: el
  // alumno igual puede elegir cursos de cualquier otro, porque los hay atrasados y
  // adelantados. Admite nulo por las cuentas creadas antes de pedirlo.
  ciclo: text("ciclo"),
  rol: rolEnum("rol").notNull().default("alumno"),
  estado: estadoAlumnoEnum("estado").notNull().default("activo"),
  perfilCompleto: boolean("perfil_completo").notNull().default(false),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
});
