"use server";

import { randomBytes } from "node:crypto";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/cliente";
import { actividad, pantalla } from "@/db/esquema";
import { desdeCampoLocal } from "@/lib/fechas";
import { codigoCortoAleatorio } from "@/lib/qr/codigo-corto";
import { generarSecreto } from "@/lib/qr/codigo";
import { requireAdmin } from "@/lib/sesion";

export type EstadoFormulario = { error: string | null; mensaje?: string | null };

const TIPOS = new Set(["global", "extra"]);
const ESTADOS = new Set(["borrador", "publicada", "cerrada"]);

/** Rango razonable para la ventana del codigo. Menos de 15 s no da tiempo ni a pulsar. */
const VENTANA_MINIMA = 15;
const VENTANA_MAXIMA = 600;

type CamposActividad = {
  nombre: string;
  descripcion: string | null;
  lugar: string | null;
  tipo: "global" | "extra";
  puntos: number;
  iniciaEn: Date;
  terminaEn: Date;
  marcajeAbreEn: Date;
  marcajeCierraEn: Date;
  ventanaSeg: number;
  estado: "borrador" | "publicada" | "cerrada";
  lat: number | null;
  lon: number | null;
  radioM: number | null;
};

/**
 * Zona del evento. O van los tres o no va ninguno: media zona no sirve para nada. Vacio
 * significa "esta actividad no usa ubicacion" (docs/plan-geolocalizacion.md).
 */
function leerZona(formData: FormData): { lat: number | null; lon: number | null; radioM: number | null } | string {
  const crudoLat = String(formData.get("lat") ?? "").trim();
  const crudoLon = String(formData.get("lon") ?? "").trim();
  const crudoRadio = String(formData.get("radioM") ?? "").trim();

  if (!crudoLat && !crudoLon && !crudoRadio) return { lat: null, lon: null, radioM: null };
  if (!crudoLat || !crudoLon || !crudoRadio) {
    return "Para usar ubicación completá latitud, longitud y radio. O dejá los tres vacíos.";
  }

  const lat = Number(crudoLat);
  const lon = Number(crudoLon);
  const radioM = Number(crudoRadio);

  if (!Number.isFinite(lat) || Math.abs(lat) > 90) return "La latitud tiene que ir entre -90 y 90.";
  if (!Number.isFinite(lon) || Math.abs(lon) > 180) return "La longitud tiene que ir entre -180 y 180.";
  if (!Number.isInteger(radioM) || radioM < 20 || radioM > 5000) {
    return "El radio va de 20 a 5000 metros.";
  }
  return { lat, lon, radioM };
}

function leerCampos(formData: FormData): CamposActividad | string {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "");
  const estado = String(formData.get("estado") ?? "borrador");
  const puntos = Number(formData.get("puntos"));
  const ventanaSeg = Number(formData.get("ventanaSeg"));

  if (!nombre) return "Poné un nombre para la actividad.";
  if (!TIPOS.has(tipo)) return "Elegí el tipo de actividad.";
  if (!ESTADOS.has(estado)) return "Estado no válido.";
  if (!Number.isInteger(puntos) || puntos < 1) return "Los puntos tienen que ser un entero de 1 o más.";
  if (!Number.isInteger(ventanaSeg) || ventanaSeg < VENTANA_MINIMA || ventanaSeg > VENTANA_MAXIMA) {
    return `La ventana del código va de ${VENTANA_MINIMA} a ${VENTANA_MAXIMA} segundos.`;
  }

  const iniciaEn = desdeCampoLocal(String(formData.get("iniciaEn") ?? ""));
  const terminaEn = desdeCampoLocal(String(formData.get("terminaEn") ?? ""));
  const marcajeAbreEn = desdeCampoLocal(String(formData.get("marcajeAbreEn") ?? ""));
  const marcajeCierraEn = desdeCampoLocal(String(formData.get("marcajeCierraEn") ?? ""));

  if (!iniciaEn || !terminaEn) return "Completá cuándo empieza y cuándo termina la actividad.";
  if (!marcajeAbreEn || !marcajeCierraEn) return "Completá la ventana de marcaje.";
  if (terminaEn <= iniciaEn) return "La actividad no puede terminar antes de empezar.";
  if (marcajeCierraEn <= marcajeAbreEn) return "El marcaje no puede cerrar antes de abrir.";

  const zona = leerZona(formData);
  if (typeof zona === "string") return zona;

  return {
    ...zona,
    nombre,
    descripcion: String(formData.get("descripcion") ?? "").trim() || null,
    lugar: String(formData.get("lugar") ?? "").trim() || null,
    tipo: tipo as "global" | "extra",
    puntos,
    iniciaEn,
    terminaEn,
    marcajeAbreEn,
    marcajeCierraEn,
    ventanaSeg,
    estado: estado as "borrador" | "publicada" | "cerrada",
  };
}

/** El codigo corto es unico. Se reintenta por si dos altas simultaneas chocan. */
async function codigoCortoLibre(): Promise<string> {
  for (let intento = 0; intento < 10; intento++) {
    const candidato = codigoCortoAleatorio();
    const [ocupado] = await db
      .select({ id: actividad.id })
      .from(actividad)
      .where(eq(actividad.codigoCorto, candidato))
      .limit(1);
    if (!ocupado) return candidato;
  }
  throw new Error("No se pudo generar un codigo corto libre despues de 10 intentos");
}

export async function crearActividad(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await requireAdmin();

  const campos = leerCampos(formData);
  if (typeof campos === "string") return { error: campos };

  await db.insert(actividad).values({
    ...campos,
    codigoCorto: await codigoCortoLibre(),
    // El secreto se genera aca y no sale nunca del servidor: con el, cualquiera fabrica
    // codigos validos durante todo el evento (PLANIFICACION.md §6.3).
    secretoQr: generarSecreto(),
  });

  revalidatePath("/admin/actividades");
  return { error: null, mensaje: "Actividad creada." };
}

export async function actualizarActividad(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Falta el identificador de la actividad." };

  const campos = leerCampos(formData);
  if (typeof campos === "string") return { error: campos };

  // El secreto y el codigo corto no se tocan al editar: cambiarlos invalidaria en el acto
  // el QR que ya esta proyectado.
  await db.update(actividad).set(campos).where(eq(actividad.id, id));

  revalidatePath("/admin/actividades");
  return { error: null, mensaje: "Cambios guardados." };
}

/**
 * Crea (o reutiliza) la clave con la que se abre el kiosco de una actividad.
 *
 * La clave es la credencial de la pantalla del salon. Se genera larga a proposito: no se
 * dicta ni se escribe a mano, se abre desde acá, y si se filtra solo deja ver un QR — pero
 * dejarla adivinable seria regalar el codigo vigente a cualquiera.
 */
export async function asegurarPantalla(formData: FormData): Promise<void> {
  await requireAdmin();
  const actividadId = String(formData.get("actividadId") ?? "");
  if (!actividadId) return;

  const [existente] = await db
    .select({ id: pantalla.id })
    .from(pantalla)
    .where(and(eq(pantalla.actividadId, actividadId), eq(pantalla.activa, true)))
    .limit(1);

  if (!existente) {
    await db.insert(pantalla).values({
      actividadId,
      clave: randomBytes(16).toString("base64url"),
    });
  }

  revalidatePath("/admin/actividades");
}
