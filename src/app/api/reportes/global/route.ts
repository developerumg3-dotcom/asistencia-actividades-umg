import { obtenerReporteGlobal } from "@/lib/reportes/consulta";
import { construirLibroReporte, libroABuffer } from "@/lib/reportes/excel";
import { requireAdmin } from "@/lib/sesion";

/** B10 — Excel consolidado: todas las clases activas con catedrático asignado, en un libro. */
export async function GET() {
  await requireAdmin();

  const { hojas } = await obtenerReporteGlobal();
  const libro = construirLibroReporte(hojas);
  const buffer = await libroABuffer(libro);

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="reporte-global.xlsx"',
    },
  });
}
