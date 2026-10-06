/**
 * Validación de los datos obligatorios del perfil (A3). Vive aparte de la acción del servidor
 * para poder probarla sin base. `perfilCompleto = true` solo se escribe si esto pasa: el
 * marcaje confía en ese booleano, así que no puede quedar en true con datos vacíos.
 * No verifica identidad académica (decisión cerrada aparte): solo que los datos existan.
 */

/** Los diez ciclos del pensum. El <select> ya limita, pero el servidor no confía en él. */
export const CICLOS_VALIDOS: ReadonlySet<string> = new Set(Array.from({ length: 10 }, (_, i) => String(i + 1)));

export type DatosPerfil = { carne: string; nombre: string; ciclo: string; cantidadCursos: number };

/** Devuelve el mensaje de error, o null si los datos obligatorios están completos. */
export function errorDeDatosPerfil(datos: DatosPerfil): string | null {
  if (!datos.carne.trim() || !datos.nombre.trim() || !datos.ciclo.trim()) {
    return "Completá tu carné, tu nombre completo y tu ciclo.";
  }
  if (!CICLOS_VALIDOS.has(datos.ciclo)) return "Elegí un ciclo de la lista.";
  if (datos.cantidadCursos === 0) return "Elegí al menos un curso en donde estás.";
  return null;
}
