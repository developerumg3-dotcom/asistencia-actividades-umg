import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { alumno } from "./alumno";
import { actividad } from "./actividad";

export const avisoPush = pgTable("aviso_push", {
  id: uuid("id").primaryKey().defaultRandom(),
  clave: text("clave").notNull().unique(),
  tipo: text("tipo").notNull(),
  autorId: text("autor_id").notNull().references(() => alumno.id),
  actividadId: uuid("actividad_id").references(() => actividad.id),
  titulo: text("titulo").notNull(),
  cuerpo: text("cuerpo").notNull(),
  url: text("url").notNull(),
  creadaEn: timestamp("creada_en", { withTimezone: true }).notNull().defaultNow(),
  programadaEn: timestamp("programada_en", { withTimezone: true }),
  canceladaEn: timestamp("cancelada_en", { withTimezone: true }),
}, (t) => [check("aviso_push_tipo_valido", sql`${t.tipo} in ('actividad', 'general', 'recordatorio')`)]);

export const entregaPush = pgTable("entrega_push", {
  id: uuid("id").primaryKey().defaultRandom(),
  avisoId: uuid("aviso_id").notNull().references(() => avisoPush.id),
  // Identidad historica, sin FK: un 410 elimina la suscripcion pero conserva el resultado.
  suscripcionId: uuid("suscripcion_id").notNull(),
  alumnoId: text("alumno_id").notNull().references(() => alumno.id),
  estado: text("estado").notNull().default("pendiente"),
  intentos: integer("intentos").notNull().default(0),
  reservadaEn: timestamp("reservada_en", { withTimezone: true }),
  aceptadaEn: timestamp("aceptada_en", { withTimezone: true }),
  reintentarEn: timestamp("reintentar_en", { withTimezone: true }),
  codigoError: integer("codigo_error"),
}, (t) => [
  unique("entrega_push_aviso_suscripcion_unica").on(t.avisoId, t.suscripcionId),
  index("entrega_push_aviso_estado_idx").on(t.avisoId, t.estado),
  check("entrega_push_estado_valido", sql`${t.estado} in ('pendiente','procesando','aceptada','fallida','descartada','incierta')`),
  check("entrega_push_intentos_validos", sql`${t.intentos} between 0 and 3`),
]);
