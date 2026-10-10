"use server";

import { parse } from "csv-parse/sync";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/cliente";
import { clase, docente } from "@/db/esquema";
import { columnasFaltantes, interpretarFilas, resumenDeImportacion } from "@/lib/clases-csv";
import { requireAdmin } from "@/lib/sesion";

export type EstadoFormulario = { error: string | null; mensaje?: string | null };

const estadoOk: EstadoFormulario = { error: null };

function leerCamposClase(formData: FormData) {
  return {
    codigo: String(formData.get("codigo") ?? "").trim(),
    nombre: String(formData.get("nombre") ?? "").trim(),
    docenteId: String(formData.get("docenteId") ?? ""),
    seccion: String(formData.get("seccion") ?? "").trim(),
    jornada: String(formData.get("jornada") ?? "").trim(),
    ciclo: String(formData.get("ciclo") ?? "").trim(),
  };
}

// `docenteId` y `seccion` quedan fuera: el catalogo del pensum se carga sin catedratico
// asignado y hay que poder editar esas clases igual. Ver PLANIFICACION.md §4.
const CAMPOS_OBLIGATORIOS = ["codigo", "nombre", "jornada", "ciclo"] as const;

function camposIncompletos(campos: ReturnType<typeof leerCamposClase>): boolean {
  return CAMPOS_OBLIGATORIOS.some((campo) => !campos[campo]);
}

/** Normaliza los opcionales: la cadena vacia del formulario se guarda como NULL. */
function conOpcionalesNulos(campos: ReturnType<typeof leerCamposClase>) {
  return {
    ...campos,
    docenteId: campos.docenteId || null,
    seccion: campos.seccion || null,
  };
}

export async function crearClase(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await requireAdmin();
  const campos = leerCamposClase(formData);
  if (camposIncompletos(campos)) {
    return { error: "Completá código, nombre, jornada y ciclo." };
  }

  await db.insert(clase).values(conOpcionalesNulos(campos));
  revalidatePath("/admin/clases");
  return estadoOk;
}

export async function actualizarClase(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const campos = leerCamposClase(formData);
  const activa = formData.get("activa") === "on";
  if (!id || camposIncompletos(campos)) {
    return { error: "Completá código, nombre, jornada y ciclo." };
  }

  await db
    .update(clase)
    .set({ ...conOpcionalesNulos(campos), activa })
    .where(eq(clase.id, id));
  revalidatePath("/admin/clases");
  return estadoOk;
}

/**
 * Copia una clase como fila nueva (mismo codigo/nombre/jornada/ciclo/docente/seccion).
 * El catalogo del pensum siembra una sola fila por curso (codigo+jornada): para una segunda
 * seccion del mismo curso hace falta otra fila, y retipear todo a mano en "Nueva clase" es
 * lo que llevaba a editar la misma fila dos veces y perder la primera seccion.
 */
export async function duplicarClase(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Falta el id de la clase a duplicar." };

  const [original] = await db.select().from(clase).where(eq(clase.id, id)).limit(1);
  if (!original) return { error: "Esa clase ya no existe." };

  await db.insert(clase).values({
    codigo: original.codigo,
    nombre: original.nombre,
    docenteId: original.docenteId,
    seccion: original.seccion,
    jornada: original.jornada,
    ciclo: original.ciclo,
    activa: original.activa,
  });
  revalidatePath("/admin/clases");
  return { error: null, mensaje: "Clase duplicada. Cambiá la sección en la copia." };
}

export async function importarClasesCsv(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await requireAdmin();

  const archivo = formData.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { error: "Elegí un archivo CSV." };
  }

  const texto = await archivo.text();
  let filas: Record<string, string>[];
  try {
    filas = parse(texto, { columns: true, skip_empty_lines: true, trim: true });
  } catch {
    return { error: "El archivo no es un CSV válido." };
  }

  if (filas.length === 0) {
    return { error: "El archivo no tiene filas." };
  }

  // Las columnas del catedratico son opcionales: las secciones se crean antes de tener el
  // listado de profesores (ver src/lib/clases-csv.ts).
  const faltantes = columnasFaltantes(Object.keys(filas[0]));
  if (faltantes.length > 0) {
    return { error: `Faltan columnas en el CSV: ${faltantes.join(", ")}.` };
  }

  const { validas, omitidas } = interpretarFilas(filas);

  let creadas = 0;
  let sinCatedratico = 0;
  for (const fila of validas) {
    let docenteId: string | null = null;

    if (fila.catedratico) {
      let [docenteExistente] = await db
        .select()
        .from(docente)
        .where(eq(docente.email, fila.catedratico.email))
        .limit(1);
      if (!docenteExistente) {
        [docenteExistente] = await db
          .insert(docente)
          .values({ nombre: fila.catedratico.nombre, email: fila.catedratico.email })
          .returning();
      }
      docenteId = docenteExistente.id;
    } else {
      sinCatedratico++;
    }

    await db.insert(clase).values({
      codigo: fila.codigo,
      nombre: fila.nombre,
      seccion: fila.seccion,
      jornada: fila.jornada,
      ciclo: fila.ciclo,
      docenteId,
    });
    creadas++;
  }

  revalidatePath("/admin/clases");
  revalidatePath("/admin/catedraticos");
  return {
    error: null,
    mensaje: resumenDeImportacion(creadas, filas.length, sinCatedratico, omitidas),
  };
}
