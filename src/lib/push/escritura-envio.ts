import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import type * as esquema from "@/db/esquema";
import { candadoAviso, descartarDestinatariosInactivos, reservarEntregas } from "./consultas-envio";

/** Inyectable: candado, descarte y reserva en sentencias distintas, mismo batch. */
export function reservarEnBatch(base: NeonHttpDatabase<typeof esquema>, avisoId: string) {
  return base.batch([
    base.execute(candadoAviso(avisoId)), base.execute(descartarDestinatariosInactivos(avisoId)),
    base.execute(reservarEntregas(avisoId)),
  ]);
}
