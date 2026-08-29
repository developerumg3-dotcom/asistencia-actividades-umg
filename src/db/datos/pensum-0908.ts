// Pensum 0908 — Ingenieria en Sistemas de Informacion y Ciencias de la Computacion,
// jornada sabado, Escuintla. Año 2014, acta 72-13 del 23/10/2013.
//
// Extraido del PDF oficial del pensum. Es el catalogo completo de la carrera: el alumno
// elige de aca los cursos que lleva, porque el ciclo no permite deducirlos (hay quien
// lleva cursos atrasados y quien los lleva adelantados). Ver PLANIFICACION.md §4.

export type CursoPensum = {
  codigo: string;
  nombre: string;
  /** Numero de ciclo, "1" a "10". */
  ciclo: string;
};

export const JORNADA_PENSUM = "Sábado";

export const CURSOS_PENSUM: CursoPensum[] = [
  { codigo: "001", nombre: "DESARROLLO HUMANO Y PROFESIONAL", ciclo: "1" },
  { codigo: "002", nombre: "METODOLOGÍA DE LA INVESTIGACIÓN", ciclo: "1" },
  { codigo: "003", nombre: "CONTABILIDAD I", ciclo: "1" },
  { codigo: "004", nombre: "INTRODUCCIÓN A LOS SISTEMAS DE CÓMPUTO", ciclo: "1" },
  { codigo: "005", nombre: "LÓGICA DE SISTEMAS", ciclo: "1" },
  { codigo: "006", nombre: "PRECÁLCULO", ciclo: "2" },
  { codigo: "007", nombre: "ÁLGEBRA LINEAL", ciclo: "2" },
  { codigo: "008", nombre: "ALGORITMOS", ciclo: "2" },
  { codigo: "009", nombre: "CONTABILIDAD II", ciclo: "2" },
  { codigo: "010", nombre: "MATEMÁTICA DISCRETA", ciclo: "2" },
  { codigo: "011", nombre: "FÍSICA I", ciclo: "3" },
  { codigo: "012", nombre: "PROGRAMACIÓN I", ciclo: "3" },
  { codigo: "013", nombre: "CÁLCULO I", ciclo: "3" },
  { codigo: "014", nombre: "PROCESO ADMINISTRATIVO", ciclo: "3" },
  { codigo: "015", nombre: "DERECHO INFORMÁTICO", ciclo: "3" },
  { codigo: "016", nombre: "MICROECONOMÍA", ciclo: "4" },
  { codigo: "017", nombre: "PROGRAMACIÓN II", ciclo: "4" },
  { codigo: "018", nombre: "CÁLCULO II", ciclo: "4" },
  { codigo: "019", nombre: "ESTADÍSTICA I", ciclo: "4" },
  { codigo: "020", nombre: "FÍSICA II", ciclo: "4" },
  { codigo: "021", nombre: "MÉTODOS NUMÉRICOS", ciclo: "5" },
  { codigo: "022", nombre: "PROGRAMACIÓN III", ciclo: "5" },
  { codigo: "023", nombre: "EMPRENDEDORES DE NEGOCIOS", ciclo: "5" },
  { codigo: "024", nombre: "ELECTRÓNICA ANALÓGICA", ciclo: "5" },
  { codigo: "025", nombre: "ESTADÍSTICA II", ciclo: "5" },
  { codigo: "026", nombre: "INVESTIGACIÓN DE OPERACIONES", ciclo: "6" },
  { codigo: "027", nombre: "BASES DE DATOS I", ciclo: "6" },
  { codigo: "028", nombre: "AUTÓMATAS Y LENGUAJES FORMALES", ciclo: "6" },
  { codigo: "029", nombre: "SISTEMAS OPERATIVOS I", ciclo: "6" },
  { codigo: "030", nombre: "ELECTRÓNICA DIGITAL", ciclo: "6" },
  { codigo: "031", nombre: "BASES DE DATOS II", ciclo: "7" },
  { codigo: "032", nombre: "ANÁLISIS DE SISTEMAS I", ciclo: "7" },
  { codigo: "033", nombre: "SISTEMAS OPERATIVOS II", ciclo: "7" },
  { codigo: "034", nombre: "ARQUITECTURA DE COMPUTADORAS I", ciclo: "7" },
  { codigo: "035", nombre: "COMPILADORES", ciclo: "7" },
  { codigo: "036", nombre: "DESARROLLO WEB", ciclo: "8" },
  { codigo: "037", nombre: "ANÁLISIS DE SISTEMAS II", ciclo: "8" },
  { codigo: "038", nombre: "REDES DE COMPUTADORAS I", ciclo: "8" },
  { codigo: "039", nombre: "ÉTICA PROFESIONAL", ciclo: "8" },
  { codigo: "040", nombre: "ARQUITECTURA DE COMPUTADORAS II", ciclo: "8" },
  { codigo: "041", nombre: "ADMINISTRACIÓN DE TECNOLOGÍAS DE INFORMACIÓN", ciclo: "9" },
  { codigo: "042", nombre: "INGENIERÍA DE SOFTWARE", ciclo: "9" },
  { codigo: "043", nombre: "PROYECTO DE GRADUACIÓN I", ciclo: "9" },
  { codigo: "044", nombre: "REDES DE COMPUTADORAS II", ciclo: "9" },
  { codigo: "045", nombre: "INTELIGENCIA ARTIFICIAL", ciclo: "9" },
  { codigo: "046", nombre: "TELECOMUNICACIONES", ciclo: "10" },
  { codigo: "047", nombre: "SEMINARIO DE TECNOLOGÍAS DE INFORMACIÓN", ciclo: "10" },
  { codigo: "048", nombre: "ASEGURAMIENTO DE LA CALIDAD DE SOFTWARE", ciclo: "10" },
  { codigo: "049", nombre: "PROYECTO DE GRADUACIÓN II", ciclo: "10" },
  { codigo: "050", nombre: "SEGURIDAD Y AUDITORÍA DE SISTEMAS", ciclo: "10" },
];
