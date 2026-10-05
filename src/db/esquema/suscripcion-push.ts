import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { alumno } from "./alumno";

/**
 * Suscripciones a notificaciones push. Ver docs/plan-notificaciones-push.md, etapa 1.
 *
 * Un alumno puede tener varias: el teléfono y la computadora son suscripciones distintas, y
 * en iPhone la app instalada en la pantalla de inicio es otra más. Por eso la clave natural
 * es el `endpoint` y no el alumno.
 *
 * `ultimoErrorEn` existe para distinguir "nunca fallo" de "fallo y la dejamos viva": un
 * rechazo por cuota o por un error del servicio no justifica borrar la suscripcion, pero si
 * conviene poder ver cuales vienen fallando. Las que el servicio declara muertas (404/410)
 * no se marcan: se borran (ver `src/lib/push/aviso.ts`).
 */
export const suscripcionPush = pgTable("suscripcion_push", {
  id: uuid("id").primaryKey().defaultRandom(),
  alumnoId: text("alumno_id")
    .notNull()
    .references(() => alumno.id),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  creadaEn: timestamp("creada_en", { withTimezone: true }).notNull().defaultNow(),
  ultimoErrorEn: timestamp("ultimo_error_en", { withTimezone: true }),
});
