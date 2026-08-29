import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit no carga .env.local automáticamente como sí hace Next.js.
config({ path: ".env.local" });

export default defineConfig({
  out: "./src/db/migraciones",
  schema: "./src/db/esquema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    // Conexión directa (sin -pooler): drizzle-kit la necesita para migrar.
    url: process.env.DATABASE_URL_UNPOOLED!,
  },
});
