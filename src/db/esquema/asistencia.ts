import { bigint, inet, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { actividad } from "./actividad";
import { alumno } from "./alumno";
import { origenAsistenciaEnum } from "./enums";

export const asistencia = pgTable(
  "asistencia",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    alumnoId: text("alumno_id")
      .notNull()
      .references(() => alumno.id),
    actividadId: uuid("actividad_id")
      .notNull()
      .references(() => actividad.id),
    marcadaEn: timestamp("marcada_en", { withTimezone: true }).notNull().defaultNow(),
    slot: bigint("slot", { mode: "bigint" }).notNull(),
    origen: origenAsistenciaEnum("origen").notNull(),
    notaManual: text("nota_manual"),
    ip: inet("ip"),
    dispositivoId: text("dispositivo_id"),
    userAgent: text("user_agent"),
    // Solo auditoría (PLANIFICACION.md §4): no participa en el cálculo de puntos.
    clasesSnapshot: uuid("clases_snapshot").array(),
  },
  (tabla) => [unique().on(tabla.alumnoId, tabla.actividadId)],
);
