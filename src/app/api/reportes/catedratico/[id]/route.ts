import { obtenerReporteDeDocente } from "@/lib/reportes/consulta";
import { construirLibroReporte, libroABuffer } from "@/lib/reportes/excel";
import { requireAdmin } from "@/lib/sesion";

/** B10 — Excel de un solo catedrático: una hoja por cada una de sus clases (§9). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const reporte = await obtenerReporteDeDocente(id);
  if (!reporte) return new Response("Catedrático no encontrado.", { status: 404 });

  const libro = construirLibroReporte(reporte.hojas);
  const buffer = await libroABuffer(libro);
  const nombreArchivo = `reporte-${reporte.docenteNombre.replace(/[^\p{L}\p{N}]+/gu, "-").toLowerCase()}.xlsx`;

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
    },
  });
}
