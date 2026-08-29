import { customType } from "drizzle-orm/pg-core";

// Drizzle no trae un helper nativo para bytea. `secreto_qr` lo necesita: 32 bytes que
// nunca salen del servidor (PLANIFICACION.md §4 y §6.1).
export const bytea = customType<{ data: Buffer }>({
  dataType() {
    return "bytea";
  },
});
