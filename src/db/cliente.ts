import { drizzle } from "drizzle-orm/neon-http";
import * as esquema from "./esquema";

// Conexión con pooler: es la que usa la aplicación en tiempo de ejecución. Las migraciones
// usan DATABASE_URL_UNPOOLED (ver drizzle.config.ts).
export const db = drizzle(process.env.DATABASE_URL!, { schema: esquema });
