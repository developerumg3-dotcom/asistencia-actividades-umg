/**
 * Interpretacion del CSV de clases (Importar por CSV, /admin/clases). Logica pura: recibe las
 * filas ya parseadas y decide cuales se pueden crear y por que se omite cada una de las demas.
 * Va aparte de la accion del servidor para poder probarla sin base: `scripts/probar-clases-csv.mts`.
 *
 * El catedratico es OPCIONAL. Las secciones se crean antes de que la facultad entregue el
 * listado de profesores, y los alumnos tienen que poder inscribirse y marcar igual. El
 * catedratico se asigna despues, desde la clase; solo hace falta antes de exportar su Excel.
 */

/** Sin estas columnas no hay clase que crear. */
export const COLUMNAS_OBLIGATORIAS = ["codigo", "nombre", "seccion", "jornada", "ciclo"] as const;

/** Opcionales, y de a pares: o vienen las dos o ninguna. */
export const COLUMNAS_CATEDRATICO = ["docente_nombre", "docente_email"] as const;

export type FilaClase = {
  codigo: string;
  nombre: string;
  seccion: string;
  jornada: string;
  ciclo: string;
  /** `null` = sin catedratico todavia. */
  catedratico: { nombre: string; email: string } | null;
};

export type FilaOmitida = { fila: number; motivo: string };

/** Columnas obligatorias que no estan en la cabecera. Las del catedratico no cuentan. */
export function columnasFaltantes(columnas: readonly string[]): string[] {
  return COLUMNAS_OBLIGATORIAS.filter((c) => !columnas.includes(c));
}

const leer = (fila: Record<string, string | undefined>, columna: string) =>
  (fila[columna] ?? "").trim();

/**
 * Separa las filas validas de las que no se pueden crear, con el motivo de cada una.
 *
 * El numero de fila es el del archivo tal como lo ve quien lo abre en Excel: la cabecera es
 * la 1, asi que la primera fila de datos es la 2. Antes las filas incompletas se omitian en
 * silencio, y un CSV entero sin catedraticos daba "Se importaron 0 de 30" sin decir por que.
 */
export function interpretarFilas(filas: readonly Record<string, string | undefined>[]): {
  validas: FilaClase[];
  omitidas: FilaOmitida[];
} {
  const validas: FilaClase[] = [];
  const omitidas: FilaOmitida[] = [];

  filas.forEach((cruda, indice) => {
    const fila = indice + 2;

    const vacias = COLUMNAS_OBLIGATORIAS.filter((c) => !leer(cruda, c));
    if (vacias.length > 0) {
      omitidas.push({ fila, motivo: `falta ${vacias.join(", ")}` });
      return;
    }

    const nombreDocente = leer(cruda, "docente_nombre");
    const emailDocente = leer(cruda, "docente_email");
    // Uno sin el otro es ambiguo: con solo el nombre no hay como buscar al catedratico, y con
    // solo el correo se crearia uno sin nombre. Mejor omitir y decirlo que adivinar.
    if (Boolean(nombreDocente) !== Boolean(emailDocente)) {
      omitidas.push({
        fila,
        motivo: "tiene el nombre o el correo del catedrático, pero no los dos (dejá ambos vacíos si todavía no hay)",
      });
      return;
    }

    validas.push({
      codigo: leer(cruda, "codigo"),
      nombre: leer(cruda, "nombre"),
      seccion: leer(cruda, "seccion"),
      jornada: leer(cruda, "jornada"),
      ciclo: leer(cruda, "ciclo"),
      catedratico: nombreDocente ? { nombre: nombreDocente, email: emailDocente } : null,
    });
  });

  return { validas, omitidas };
}

/** Cuantas omisiones se detallan en el mensaje antes de resumir el resto. */
const MAXIMO_DETALLADAS = 5;

/** Mensaje final para el administrador: cuantas entraron y por que no entraron las demas. */
export function resumenDeImportacion(
  creadas: number,
  total: number,
  sinCatedratico: number,
  omitidas: readonly FilaOmitida[],
): string {
  const partes = [`Se importaron ${creadas} de ${total} filas.`];
  if (sinCatedratico > 0) {
    partes.push(
      `${sinCatedratico} ${sinCatedratico === 1 ? "quedó" : "quedaron"} sin catedrático: los alumnos ya se pueden inscribir y marcar.`,
    );
  }
  if (omitidas.length > 0) {
    const detalle = omitidas
      .slice(0, MAXIMO_DETALLADAS)
      .map((o) => `fila ${o.fila} (${o.motivo})`)
      .join("; ");
    const resto = omitidas.length - MAXIMO_DETALLADAS;
    partes.push(`Se omitieron ${omitidas.length}: ${detalle}${resto > 0 ? `; y ${resto} más` : ""}.`);
  }
  return partes.join(" ");
}
