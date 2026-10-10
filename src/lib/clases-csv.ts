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
  /** Numero de fila en el archivo, como lo ve quien lo abre en Excel. */
  fila: number;
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
      fila,
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

/**
 * Que identifica a una seccion: el mismo curso, la misma seccion y la misma jornada. Sin
 * distinguir mayusculas ni espacios de los bordes: "a" y " A " son la misma seccion.
 *
 * Las filas del catalogo base (las del pensum, sin seccion) nunca coinciden con una fila del
 * CSV, porque el CSV exige seccion: son cosas distintas y no se tocan.
 */
export function claveDeSeccion(c: { codigo: string; seccion: string | null; jornada: string }): string {
  const n = (s: string | null) => (s ?? "").trim().toLowerCase();
  return `${n(c.codigo)}|${n(c.seccion)}|${n(c.jornada)}`;
}

/** Una clase que ya esta en la base, con el correo de su catedratico si tiene. */
export type ClaseExistente = {
  id: string;
  codigo: string;
  seccion: string | null;
  jornada: string;
  emailCatedratico: string | null;
};

export type PlanDeImportacion = {
  /** Secciones nuevas. */
  crear: FilaClase[];
  /** Secciones que ya existian sin catedratico y ahora lo traen: se les asigna. */
  asignar: { claseId: string; fila: FilaClase }[];
  /** Ya existian igual, o se repetian dentro del mismo archivo. No se hace nada. */
  yaExistian: number;
  omitidas: FilaOmitida[];
};

/**
 * Decide que hacer con cada fila valida comparandola con lo que ya hay en la base y con las
 * filas anteriores del mismo archivo. Es lo que hace segura una segunda carga: antes, volver a
 * importar el mismo CSV para corregir una fila duplicaba TODAS las secciones, y los alumnos las
 * veian dos veces al inscribirse.
 *
 * Tambien permite el camino natural de la puesta a punto: hoy se importan las secciones sin
 * profesor, y cuando llegue el listado se vuelve a importar el mismo archivo con los
 * catedraticos llenos. Las secciones existentes sin catedratico lo reciben; no se duplican.
 *
 * Lo que NO se pisa: una seccion que ya tiene un catedratico distinto. Eso es un conflicto
 * real (o un error en el archivo) y lo decide una persona desde la clase, no la importacion.
 */
export function planificarImportacion(
  validas: readonly FilaClase[],
  existentes: readonly ClaseExistente[],
): PlanDeImportacion {
  const enBase = new Map(existentes.map((e) => [claveDeSeccion(e), e]));
  const vistasEnArchivo = new Set<string>();
  const plan: PlanDeImportacion = { crear: [], asignar: [], yaExistian: 0, omitidas: [] };

  for (const fila of validas) {
    const clave = claveDeSeccion(fila);

    if (vistasEnArchivo.has(clave)) {
      plan.omitidas.push({ fila: fila.fila, motivo: "repetida dentro del mismo archivo" });
      continue;
    }
    vistasEnArchivo.add(clave);

    const existente = enBase.get(clave);
    if (!existente) {
      plan.crear.push(fila);
      continue;
    }

    const emailNuevo = fila.catedratico?.email.toLowerCase() ?? null;
    const emailActual = existente.emailCatedratico?.toLowerCase() ?? null;

    if (emailNuevo && !emailActual) {
      plan.asignar.push({ claseId: existente.id, fila });
    } else if (emailNuevo && emailActual && emailNuevo !== emailActual) {
      plan.omitidas.push({
        fila: fila.fila,
        motivo: "esa sección ya tiene otro catedrático; cambialo desde la clase si corresponde",
      });
    } else {
      plan.yaExistian++;
    }
  }

  return plan;
}

/** Cuantas omisiones se detallan en el mensaje antes de resumir el resto. */
const MAXIMO_DETALLADAS = 5;

/** Mensaje final para el administrador: que paso con cada fila del archivo. */
export function resumenDeImportacion({
  total,
  creadas,
  sinCatedratico,
  asignadas,
  yaExistian,
  omitidas,
}: {
  total: number;
  creadas: number;
  sinCatedratico: number;
  asignadas: number;
  yaExistian: number;
  omitidas: readonly FilaOmitida[];
}): string {
  const partes = [`Se crearon ${creadas} de ${total} filas.`];
  if (sinCatedratico > 0) {
    partes.push(
      `${sinCatedratico} ${sinCatedratico === 1 ? "quedó" : "quedaron"} sin catedrático: los alumnos ya se pueden inscribir y marcar.`,
    );
  }
  if (asignadas > 0) {
    partes.push(
      `A ${asignadas} ${asignadas === 1 ? "sección que ya existía se le asignó" : "secciones que ya existían se les asignó"} su catedrático.`,
    );
  }
  if (yaExistian > 0) {
    partes.push(`${yaExistian} ya ${yaExistian === 1 ? "existía" : "existían"} y no se duplicaron.`);
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
