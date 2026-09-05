import {
  bigint,
  doublePrecision,
  inet,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
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

    // Ubicación reportada por el teléfono al marcar. Nula si el alumno negó el permiso o si
    // la actividad no declara zona: eso no le impide marcar (docs/plan-geolocalizacion.md).
    lat: doublePrecision("lat"),
    lon: doublePrecision("lon"),
    /** Margen de error en metros que informa el propio navegador. */
    precisionM: integer("precision_m"),
    /** Distancia al centro declarado, ya calculada, para no recalcularla al consultar. */
    distanciaM: integer("distancia_m"),
  },
  (tabla) => [unique().on(tabla.alumnoId, tabla.actividadId)],
);
