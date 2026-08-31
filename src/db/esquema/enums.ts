import { pgEnum } from "drizzle-orm/pg-core";

export const rolEnum = pgEnum("rol", ["alumno", "admin"]);
export const estadoAlumnoEnum = pgEnum("estado_alumno", ["activo", "bloqueado"]);

export const tipoActividadEnum = pgEnum("tipo_actividad", ["global", "extra"]);
export const estadoActividadEnum = pgEnum("estado_actividad", [
  "borrador",
  "publicada",
  "cerrada",
]);

export const origenAsistenciaEnum = pgEnum("origen_asistencia", ["qr", "manual"]);

// No enumerado explícitamente en PLANIFICACION.md §4. Cubre lo que usa esta fase
// (registro, perfil, inscripciones) y dos valores más para cuando llegue el QR en la Fase 2,
// así se evita otra migración de enum por ahora.
export const eventoBitacoraEnum = pgEnum("evento_bitacora", [
  "registro",
  "perfil_completado",
  "inscripcion_creada",
  "inscripcion_eliminada",
  "marcaje",
  // Fase 4: el administrador limpia `alumno.carne` para resolver un conflicto de carné.
  "carne_liberado",
]);

// Los cinco literales de la §7 de PLANIFICACION.md.
export const resultadoBitacoraEnum = pgEnum("resultado_bitacora", [
  "ok",
  "expirado",
  "duplicado",
  "invalido",
  "fuera_de_horario",
  "sin_perfil",
]);
