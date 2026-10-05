import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { alumno } from "./alumno";

/**
 * Suscripcion de un dispositivo a las notificaciones push. Ver docs/plan-notificaciones-push.md.
 *
 * Un alumno puede tener varias: el telefono y la computadora son suscripciones distintas, y
 * reinstalar la app genera una nueva. Por eso la clave natural es el `endpoint`, no el alumno.
 *
 * Nada de esto sirve si el alumno no acepto el permiso, y en iPhone ademas tiene que haber
 * instalado la app en su pantalla de inicio. Es la limitacion central de la funcion.
 */
export const suscripcionPush = pgTable(
  "suscripcion_push",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    alumnoId: text("alumno_id")
      .notNull()
      .references(() => alumno.id),

    /**
     * URL que da el navegador para entregarle a ESTE dispositivo. Es el identificador real
     * de la suscripcion: si el alumno reinstala, cambia, y la vieja queda muerta.
     */
    endpoint: text("endpoint").notNull().unique(),

    /** Clave publica del dispositivo, para cifrar el contenido del aviso. */
    p256dh: text("p256dh").notNull(),
    /** Secreto de autenticacion del dispositivo. */
    auth: text("auth").notNull(),

    creadaEn: timestamp("creada_en", { withTimezone: true }).notNull().defaultNow(),

    /**
     * Cuando fallo el ultimo envio. Una suscripcion que responde 404 o 410 esta muerta y se
     * borra; esto es para los fallos pasajeros, que no justifican borrarla.
     */
    ultimoErrorEn: timestamp("ultimo_error_en", { withTimezone: true }),
  },
  // Se consulta siempre por alumno al calcular a cuantos les va a llegar un aviso.
  (tabla) => [index("suscripcion_push_alumno_idx").on(tabla.alumnoId)],
);
