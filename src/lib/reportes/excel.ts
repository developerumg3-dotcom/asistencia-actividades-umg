import "server-only";

import ExcelJS from "exceljs";
import { enGuatemala } from "@/lib/fechas";
import type { HojaReporte } from "./consulta";

const CARACTERES_INVALIDOS_HOJA = /[:\\/?*[\]]/g;
const LARGO_MAXIMO_HOJA = 31;

/** Excel prohibe ciertos caracteres y corta a 31 en el nombre de hoja; hay que dedupear a mano. */
function nombresDeHoja(hojas: HojaReporte[]): string[] {
  const usados = new Set<string>();
  return hojas.map((hoja) => {
    const base = `${hoja.claseCodigo}${hoja.claseSeccion ? ` ${hoja.claseSeccion}` : ""}`
      .replace(CARACTERES_INVALIDOS_HOJA, "")
      .slice(0, LARGO_MAXIMO_HOJA)
      .trim();
    let nombre = base || hoja.claseId.slice(0, 8);
    let sufijo = 2;
    while (usados.has(nombre)) {
      nombre = `${base.slice(0, LARGO_MAXIMO_HOJA - 4)} (${sufijo++})`;
    }
    usados.add(nombre);
    return nombre;
  });
}

/**
 * Un libro con una hoja por clase, formato de §9: encabezado con clase/seccion/jornada/ciclo,
 * catedratico y fecha de generacion; columnas Carne, Nombre, una por actividad global con su
 * nombre real, Extra y Total; totales en negrita; anchos ajustados. `construirHoja` en
 * `consulta.ts` ya ordeno las filas y calculo los totales — esta funcion solo vuelca esos
 * datos al formato de exceljs, no decide nada de negocio.
 */
export function construirLibroReporte(hojas: HojaReporte[], generadoEn: Date = new Date()): ExcelJS.Workbook {
  const libro = new ExcelJS.Workbook();
  libro.creator = "Ronda";
  libro.created = generadoEn;

  if (hojas.length === 0) {
    libro.addWorksheet("Sin datos").addRow(["No hay clases con catedrático asignado para exportar."]);
    return libro;
  }

  const nombres = nombresDeHoja(hojas);

  hojas.forEach((hoja, indice) => {
    const sheet = libro.addWorksheet(nombres[indice]);

    sheet.addRow([`${hoja.claseNombre} (${hoja.claseCodigo})`]).font = { bold: true, size: 12 };
    sheet.addRow([`Sección ${hoja.claseSeccion ?? "—"} · ${hoja.claseJornada} · Ciclo ${hoja.claseCiclo}`]);
    sheet.addRow([`Catedrático: ${hoja.docenteNombre}`]);
    sheet.addRow([`Generado: ${enGuatemala(generadoEn)}`]);
    sheet.addRow([]);

    const encabezados = ["Carné", "Nombre", ...hoja.columnas.map((c) => c.nombre), "Extra", "Total"];
    sheet.addRow(encabezados).font = { bold: true };
    const filaEncabezadoNum = sheet.rowCount;

    if (hoja.filas.length === 0) {
      sheet.addRow(["Sin alumnos inscritos en esta clase."]);
    } else {
      for (const fila of hoja.filas) {
        sheet.addRow([
          fila.carne ?? "",
          fila.nombreOCorreo,
          ...hoja.columnas.map((c) => fila.marcas[c.id] ?? 0),
          fila.extra,
          fila.total,
        ]);
      }
    }

    const columnaTotal = encabezados.length;
    for (let fila = filaEncabezadoNum + 1; fila <= sheet.rowCount; fila++) {
      sheet.getRow(fila).getCell(columnaTotal).font = { bold: true };
    }

    sheet.columns = [
      { width: 16 },
      { width: 32 },
      ...hoja.columnas.map(() => ({ width: 14 })),
      { width: 8 },
      { width: 10 },
    ];
  });

  return libro;
}

/**
 * `ArrayBuffer` puro, no `Buffer` ni `Uint8Array`: con la version de TypeScript de este
 * proyecto, el tipo generico de `Uint8Array<ArrayBufferLike>` (Node) no encaja con el
 * `BodyInit` que espera `Response` (DOM) en los route handlers de `api/reportes/*`. Un
 * `ArrayBuffer` sin adjetivos si encaja con los dos.
 */
export async function libroABuffer(libro: ExcelJS.Workbook): Promise<ArrayBuffer> {
  const datos = await libro.xlsx.writeBuffer();
  const copia = new Uint8Array(datos);
  return copia.buffer.slice(copia.byteOffset, copia.byteOffset + copia.byteLength) as ArrayBuffer;
}
