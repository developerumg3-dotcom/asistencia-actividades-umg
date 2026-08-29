/**
 * Los nombres del pensum vienen todos en mayusculas y gritan en pantalla. Se pasan a
 * capitalizacion de titulo, con dos excepciones: los numeros romanos (I, II, III) no son
 * palabras y se quedan enteros, y los conectores van en minuscula salvo al inicio, que es
 * como se escribe en espanol ("Introduccion a los Sistemas de Computo").
 */
const ROMANOS = new Set(["I", "II", "III", "IV", "V"]);
const CONECTORES = new Set(["de", "del", "la", "las", "el", "los", "y", "e", "a", "en", "con", "para"]);

export function enTitulo(texto: string) {
  let esPrimera = true;
  return texto
    .split(/(\s+)/)
    .map((parte) => {
      if (!parte.trim()) return parte;
      const limpio = parte.replace(/[^\p{L}]/gu, "");
      if (ROMANOS.has(limpio.toUpperCase()) && limpio.length === parte.length) {
        esPrimera = false;
        return parte.toUpperCase();
      }
      const bajo = parte.toLocaleLowerCase("es");
      const deboBajar = !esPrimera && CONECTORES.has(bajo);
      esPrimera = false;
      return deboBajar ? bajo : bajo.charAt(0).toLocaleUpperCase("es") + bajo.slice(1);
    })
    .join("");
}
