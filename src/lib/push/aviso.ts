import { enGuatemala } from "@/lib/fechas";

/**
 * Logica pura de los avisos push: armar el texto y decidir que hacer con una suscripcion que
 * fallo. Separada del envio (`envio.ts`, que habla con `web-push` y con la base) justamente
 * para poder probarla sin red ni base — ver `scripts/probar-push.mts`.
 *
 * Ver docs/plan-notificaciones-push.md.
 */

/** Lo que el service worker espera recibir en el payload (ver `public/sw.js`). */
export type Aviso = {
  /**
   * Identifica el AVISO, no la pantalla a la que lleva. El service worker lo usa como `tag`
   * de la notificacion: dos avisos con id distinto conviven en la bandeja, y solo se
   * reemplaza el reintento de uno con el mismo id. Antes el tag era la URL y, como todos
   * apuntan a `/inicio`, un aviso nuevo borraba al anterior.
   */
  id: string;
  titulo: string;
  cuerpo: string;
  /** Siempre una ruta interna del sitio: ver `esRutaInterna`. */
  url: string;
};

/**
 * `true` solo para una ruta del propio sitio ("/inicio", "/actividades/3?x=1").
 *
 * Rechaza lo que el navegador resolveria hacia otro origen: "//evil.com" (mismo esquema, otro
 * host), "/\evil.com" (algunos navegadores tratan la barra invertida como "/"), URLs con
 * esquema ("https://...", "javascript:...") y cualquier caracter de control. La URL viaja en
 * un push: si apuntara fuera, abriria un sitio ajeno desde una notificacion con el nombre
 * de la app.
 */
export function esRutaInterna(url: string): boolean {
  if (typeof url !== "string" || !url.startsWith("/")) return false;
  if (url.startsWith("//")) return false;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f\\]/.test(url)) return false;
  return true;
}

/** Lo que se le dice al administrador tras un envio: el detalle, no un "listo" a secas. */
export function resumenDeEnvio(r: { entregados: number; borradas: number; fallidos: number }): string {
  const partes = [`Enviado a ${r.entregados} ${r.entregados === 1 ? "dispositivo" : "dispositivos"}.`];
  if (r.borradas > 0) partes.push(`Se descartaron ${r.borradas} que ya no existen.`);
  if (r.fallidos > 0) partes.push(`${r.fallidos} fallaron y se van a reintentar en el próximo aviso.`);
  return partes.join(" ");
}

/** Lo unico de una actividad que hace falta para armar el aviso. */
export type ActividadParaAviso = {
  id: string;
  nombre: string;
  lugar: string | null;
  iniciaEn: Date;
};

/**
 * Texto del aviso de una actividad.
 *
 * El titulo es el nombre tal cual: es lo unico que se ve seguro en la bandeja, porque el
 * cuerpo lo recorta cada sistema a un largo distinto. Por eso la fecha va primero en el
 * cuerpo y el lugar despues: si se corta, lo que se pierde es el dato menos urgente.
 *
 * La hora sale de `enGuatemala`: la base guarda UTC y el alumno lee hora de Guatemala
 * (AGENTS.md, regla 7). Una notificacion con la hora corrida seis horas es peor que ninguna.
 */
export function textoDeAviso(actividad: ActividadParaAviso): Aviso {
  const cuando = enGuatemala(actividad.iniciaEn);
  const cuerpo = actividad.lugar ? `${cuando} · ${actividad.lugar}` : cuando;

  return {
    // Reenviar el aviso de la MISMA actividad reemplaza al anterior (es el mismo aviso); el de
    // otra actividad convive con el.
    id: `actividad-${actividad.id}`,
    titulo: actividad.nombre,
    cuerpo,
    // Al inicio y no a la pantalla de marcaje: el marcaje se abre escaneando el QR del
    // evento, no desde un enlace (PLANIFICACION.md §6).
    url: "/inicio",
  };
}

/**
 * Que hacer con una suscripcion cuyo envio fallo.
 *
 * `borrar` solo cuando el servicio de push dice que esa direccion ya no existe: 404 (no
 * esta) y 410 Gone (la dio de baja). Eso pasa cuando el alumno desinstalo la app o limpio
 * los datos del navegador, y es definitivo — reintentar nunca va a funcionar y cada envio
 * siguiente paga el costo de esa direccion muerta.
 *
 * Cualquier otro codigo es del momento, no de la suscripcion: 429 es cuota, 500 y 503 son
 * problemas del servicio, 401 y 403 son nuestras propias claves VAPID mal configuradas.
 * Borrar por uno de esos seria destruir suscripciones buenas por un error nuestro, y el
 * alumno no puede volver a suscribirse sin que el navegador le pregunte de nuevo — cosa que
 * no hace. Ante la duda, se conserva.
 */
export type DecisionSuscripcion = "borrar" | "marcar";

export function decidirSobreError(codigo: number | undefined): DecisionSuscripcion {
  return codigo === 404 || codigo === 410 ? "borrar" : "marcar";
}

/**
 * Frase que el panel muestra ANTES de enviar: "Le va a llegar a 34 de 120 alumnos".
 *
 * Es la pieza central del diseño. Sin ella, el administrador aprieta el boton y asume que
 * llego a todo el curso, cuando en realidad solo llega a quien acepto el permiso y —en
 * iPhone— instalo la app. Ver docs/plan-notificaciones-push.md, "El problema del iPhone".
 */
export function frasePorcentajeAlcance(suscritos: number, total: number): string {
  if (total === 0) return "Todavía no hay cuentas registradas.";
  if (suscritos === 0) {
    return `No le va a llegar a nadie: ninguna de las ${total} cuentas activó los avisos.`;
  }
  // Dice "cuentas" y no "alumnos" porque el envio va a TODAS las suscripciones sin mirar el
  // rol: las de administracion tambien reciben. Llamarlas alumnos haria que el numero no
  // cuadre con quienes de verdad lo reciben.
  //
  // El plural concuerda con el total, no con los suscritos: "1 de 120 cuentas", no
  // "1 de 120 cuenta".
  const cuentas = total === 1 ? "cuenta" : "cuentas";
  return `Le va a llegar a ${suscritos} de ${total} ${cuentas}.`;
}
