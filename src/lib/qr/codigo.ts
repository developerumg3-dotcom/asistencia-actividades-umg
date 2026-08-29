import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Derivacion del codigo rotativo del QR. Ver PLANIFICACION.md §6.1.
 *
 *     slot   = floor(unix_time / ventana_seg)
 *     codigo = base64url( HMAC_SHA256(secreto, actividad_id ‖ slot) )[0..9]
 *
 * Es el mismo principio que un token de Google Authenticator: no se guarda ningun codigo en
 * la base, el servidor recalcula el que corresponde al momento en que llega la peticion.
 *
 * Este modulo es solo de servidor. El `secreto` nunca puede llegar al navegador: con el,
 * cualquiera fabrica codigos validos durante todo el evento.
 */

/** Largo del codigo visible, en caracteres base64url. */
export const LARGO_CODIGO = 10;

/** Bytes del secreto de cada actividad. */
export const BYTES_SECRETO = 32;

/**
 * Segundos de gracia que se le conceden al slot anterior, para cubrir latencia de red y
 * desfases de reloj entre la pantalla y el telefono. PLANIFICACION.md §6.2.
 */
export const GRACIA_SEG = 10;

/**
 * Cuantos slots hacia atras se siguen reconociendo como "este codigo fue valido". No los
 * acepta: sirve para responder "expirado" en vez de "invalido", que es un mensaje mucho mas
 * util para el alumno (§7). Cinco minutos con la ventana por defecto de 60 s.
 */
export const SLOTS_RECONOCIDOS = 5;

export function generarSecreto(): Buffer {
  return randomBytes(BYTES_SECRETO);
}

/** Numero de ventana al que pertenece un momento dado. */
export function slotDe(momento: Date, ventanaSeg: number): number {
  if (!Number.isFinite(ventanaSeg) || ventanaSeg <= 0) {
    throw new RangeError(`ventanaSeg tiene que ser un entero positivo, llego ${ventanaSeg}`);
  }
  return Math.floor(momento.getTime() / 1000 / ventanaSeg);
}

/** Momento en que empieza un slot. */
export function inicioDeSlot(slot: number, ventanaSeg: number): Date {
  return new Date(slot * ventanaSeg * 1000);
}

/** Segundos que le quedan de vida al slot vigente. Alimenta el contador del kiosco. */
export function segundosRestantes(momento: Date, ventanaSeg: number): number {
  const siguiente = inicioDeSlot(slotDe(momento, ventanaSeg) + 1, ventanaSeg);
  return Math.ceil((siguiente.getTime() - momento.getTime()) / 1000);
}

export function derivarCodigo(secreto: Buffer, actividadId: string, slot: number): string {
  return createHmac("sha256", secreto)
    .update(`${actividadId}:${slot}`)
    .digest("base64url")
    .slice(0, LARGO_CODIGO);
}

/** Codigo vigente en un momento dado. */
export function codigoVigente(
  secreto: Buffer,
  actividadId: string,
  ventanaSeg: number,
  momento: Date,
): string {
  return derivarCodigo(secreto, actividadId, slotDe(momento, ventanaSeg));
}

export type CodigoProgramado = {
  slot: number;
  codigo: string;
  /** Momento en que este codigo empieza a mostrarse. */
  vigenteDesde: Date;
};

/**
 * El codigo vigente mas los siguientes, para que la pantalla del kiosco siga rotando aunque
 * se caiga la red un momento. PLANIFICACION.md §6.3.
 */
export function codigosProximos(
  secreto: Buffer,
  actividadId: string,
  ventanaSeg: number,
  momento: Date,
  cantidad: number,
): CodigoProgramado[] {
  const primero = slotDe(momento, ventanaSeg);
  return Array.from({ length: cantidad }, (_, i) => {
    const slot = primero + i;
    return {
      slot,
      codigo: derivarCodigo(secreto, actividadId, slot),
      vigenteDesde: inicioDeSlot(slot, ventanaSeg),
    };
  });
}

/** Comparacion en tiempo constante, para no filtrar el codigo correcto por el reloj. */
function sonIguales(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

export type ResultadoCodigo = "ok" | "expirado" | "invalido";

/**
 * Valida el codigo que llega con el marcaje.
 *
 * Regla, de PLANIFICACION.md §6.2: vale el slot vigente, y ademas el anterior durante los
 * primeros `GRACIA_SEG` segundos del vigente. La validacion se hace contra la hora en que
 * llega el boton "Marcar asistencia", no contra la hora del escaneo — es lo que vuelve
 * inutil compartir la foto del QR.
 *
 * No comprueba el horario de la actividad ni si el alumno ya marco: eso vive en la capa que
 * la llama, porque necesita la base.
 */
export function validarCodigo({
  secreto,
  actividadId,
  ventanaSeg,
  codigo,
  momento,
  graciaSeg = GRACIA_SEG,
}: {
  secreto: Buffer;
  actividadId: string;
  ventanaSeg: number;
  codigo: string;
  momento: Date;
  graciaSeg?: number;
}): ResultadoCodigo {
  if (!codigo || codigo.length !== LARGO_CODIGO) return "invalido";

  const slotActual = slotDe(momento, ventanaSeg);

  if (sonIguales(codigo, derivarCodigo(secreto, actividadId, slotActual))) return "ok";

  const segundosDentroDelSlot =
    (momento.getTime() - inicioDeSlot(slotActual, ventanaSeg).getTime()) / 1000;
  const anterior = derivarCodigo(secreto, actividadId, slotActual - 1);

  if (segundosDentroDelSlot < graciaSeg && sonIguales(codigo, anterior)) return "ok";
  if (sonIguales(codigo, anterior)) return "expirado";

  // Ni vigente ni en gracia: distinguir un codigo que fue valido hace poco de uno inventado,
  // para poder darle al alumno el mensaje correcto.
  for (let atras = 2; atras <= SLOTS_RECONOCIDOS; atras++) {
    if (sonIguales(codigo, derivarCodigo(secreto, actividadId, slotActual - atras))) {
      return "expirado";
    }
  }

  // Un codigo del futuro solo aparece si el reloj del telefono va adelantado; para el alumno
  // es el mismo caso practico que uno vencido: volver a escanear.
  if (sonIguales(codigo, derivarCodigo(secreto, actividadId, slotActual + 1))) return "expirado";

  return "invalido";
}

/**
 * URL que se codifica dentro del QR. Se mantiene corta a proposito: menos contenido son
 * modulos mas grandes, y eso es lo que permite escanear desde el fondo del salon (§6.1).
 */
export function urlDeMarcaje(baseUrl: string, codigoCorto: string, codigo: string): string {
  return `${baseUrl.replace(/\/$/, "")}/a/${codigoCorto}/${codigo}`;
}
