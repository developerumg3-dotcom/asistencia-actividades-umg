import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/cliente";
import { actividad, pantalla } from "@/db/esquema";
import { codigosProximos, segundosRestantes } from "@/lib/qr/codigo";
import { urlDeMarcaje } from "@/lib/qr/codigo";

/**
 * Codigos para la pantalla del kiosco (B5).
 *
 * Devuelve el vigente y los siguientes, ya derivados. **El `secreto_qr` nunca sale de aca**:
 * si llegara al navegador, cualquiera con la consola abierta fabricaria codigos validos
 * durante todo el evento (PLANIFICACION.md §6.3).
 *
 * Se autoriza con la clave de pantalla, no con la sesion del administrador: asi no queda una
 * sesion con permisos abierta en la computadora del salon.
 */

/** Cuantos codigos se adelantan. Cinco minutos de autonomia con la ventana por defecto. */
const CANTIDAD = 6;

export async function GET(
  _peticion: Request,
  { params }: { params: Promise<{ clave: string }> },
) {
  const { clave } = await params;

  const [fila] = await db
    .select({
      actividadId: actividad.id,
      nombre: actividad.nombre,
      lugar: actividad.lugar,
      estado: actividad.estado,
      ventanaSeg: actividad.ventanaSeg,
      marcajeAbreEn: actividad.marcajeAbreEn,
      marcajeCierraEn: actividad.marcajeCierraEn,
      secretoQr: actividad.secretoQr,
      codigoCorto: actividad.codigoCorto,
    })
    .from(pantalla)
    .innerJoin(actividad, eq(pantalla.actividadId, actividad.id))
    .where(and(eq(pantalla.clave, clave), eq(pantalla.activa, true)))
    .limit(1);

  if (!fila) {
    return NextResponse.json({ error: "Pantalla no encontrada" }, { status: 404 });
  }

  const ahora = new Date();
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";

  const codigos = codigosProximos(
    fila.secretoQr,
    fila.actividadId,
    fila.ventanaSeg,
    ahora,
    CANTIDAD,
  ).map((c) => ({
    codigo: c.codigo,
    vigenteDesde: c.vigenteDesde.toISOString(),
    url: urlDeMarcaje(base, fila.codigoCorto, c.codigo),
  }));

  return NextResponse.json(
    {
      actividad: {
        nombre: fila.nombre,
        lugar: fila.lugar,
        estado: fila.estado,
        ventanaSeg: fila.ventanaSeg,
        marcajeAbreEn: fila.marcajeAbreEn.toISOString(),
        marcajeCierraEn: fila.marcajeCierraEn.toISOString(),
      },
      servidorEn: ahora.toISOString(),
      segundosRestantes: segundosRestantes(ahora, fila.ventanaSeg),
      codigos,
    },
    // Nunca cachear: cada respuesta trae codigos con vida util de un minuto.
    { headers: { "cache-control": "no-store" } },
  );
}
