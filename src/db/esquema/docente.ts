import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const docente = pgTable("docente", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: text("nombre").notNull(),
  // Nulo permitido: el catedratico no tiene cuenta (PLANIFICACION.md §3), el administrador lo
  // crea con solo el nombre. El correo queda como dato opcional, no como llave de nada.
  email: text("email"),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
});
