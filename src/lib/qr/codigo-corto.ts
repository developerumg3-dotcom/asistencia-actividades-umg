import { randomInt } from "node:crypto";

/**
 * Identificador publico y breve de una actividad. Va dentro del QR
 * (`/a/{codigo_corto}/{codigo}`), asi que cada caracter de mas hace el codigo mas denso y
 * mas dificil de leer desde el fondo del salon. Ver PLANIFICACION.md §6.1.
 *
 * El alfabeto excluye los caracteres que se confunden al leerlos o al dictarlos por
 * telefono: 0/O, 1/I/L, 2/Z, 5/S, 8/B. Es minuscula porque asi la URL es mas corta de
 * pronunciar y no obliga a mayusculas si alguien la escribe a mano.
 */
const ALFABETO = "acdefghjkmnpqrtuvwxy34679";

export const LARGO_CODIGO_CORTO = 5;

export function codigoCortoAleatorio(largo = LARGO_CODIGO_CORTO): string {
  let salida = "";
  for (let i = 0; i < largo; i++) {
    salida += ALFABETO[randomInt(ALFABETO.length)];
  }
  return salida;
}

export function esCodigoCortoValido(valor: string): boolean {
  if (valor.length < 3 || valor.length > 12) return false;
  return [...valor].every((caracter) => ALFABETO.includes(caracter));
}
