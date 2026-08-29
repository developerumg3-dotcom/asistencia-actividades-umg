"use server";

import { parse } from "csv-parse/sync";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/cliente";
import { clase, docente } from "@/db/esquema";
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

function camposIncompletos(campos: ReturnType<typeof leerCamposClase>): boolean {
  return Object.values(campos).some((valor) => !valor);
}

export async function crearClase(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await requireAdmin();
  const campos = leerCamposClase(formData);
  if (camposIncompletos(campos)) {
    return { error: "Completá todos los campos de la clase." };
  }

  await db.insert(clase).values(campos);
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
    return { error: "Completá todos los campos de la clase." };
  }

  await db
    .update(clase)
    .set({ ...campos, activa })
    .where(eq(clase.id, id));
  revalidatePath("/admin/clases");
  return estadoOk;
}

const CABECERA_ESPERADA = [
  "codigo",
  "nombre",
  "seccion",
  "jornada",
  "ciclo",
  "docente_nombre",
  "docente_email",
];

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

  const columnas = Object.keys(filas[0]);
  const faltantes = CABECERA_ESPERADA.filter((columna) => !columnas.includes(columna));
  if (faltantes.length > 0) {
    return { error: `Faltan columnas en el CSV: ${faltantes.join(", ")}.` };
  }

  let creadas = 0;
  for (const fila of filas) {
    const docenteEmail = fila.docente_email?.trim();
    const docenteNombre = fila.docente_nombre?.trim();
    const codigo = fila.codigo?.trim();
    const nombre = fila.nombre?.trim();
    const seccion = fila.seccion?.trim();
    const jornada = fila.jornada?.trim();
    const ciclo = fila.ciclo?.trim();
    if (!docenteEmail || !docenteNombre || !codigo || !nombre || !seccion || !jornada || !ciclo) {
      continue;
    }

    let [docenteExistente] = await db.select().from(docente).where(eq(docente.email, docenteEmail)).limit(1);
    if (!docenteExistente) {
      [docenteExistente] = await db
        .insert(docente)
        .values({ nombre: docenteNombre, email: docenteEmail })
        .returning();
    }

    await db.insert(clase).values({
      codigo,
      nombre,
      seccion,
      jornada,
      ciclo,
      docenteId: docenteExistente.id,
    });
    creadas++;
  }

  revalidatePath("/admin/clases");
  revalidatePath("/admin/catedraticos");
  return { error: null, mensaje: `Se importaron ${creadas} de ${filas.length} filas.` };
}
