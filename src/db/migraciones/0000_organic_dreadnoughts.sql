CREATE TYPE "public"."estado_actividad" AS ENUM('borrador', 'publicada', 'cerrada');--> statement-breakpoint
CREATE TYPE "public"."estado_alumno" AS ENUM('activo', 'bloqueado');--> statement-breakpoint
CREATE TYPE "public"."evento_bitacora" AS ENUM('registro', 'perfil_completado', 'inscripcion_creada', 'inscripcion_eliminada', 'marcaje');--> statement-breakpoint
CREATE TYPE "public"."origen_asistencia" AS ENUM('qr', 'manual');--> statement-breakpoint
CREATE TYPE "public"."resultado_bitacora" AS ENUM('ok', 'expirado', 'duplicado', 'invalido', 'fuera_de_horario', 'sin_perfil');--> statement-breakpoint
CREATE TYPE "public"."rol" AS ENUM('alumno', 'admin');--> statement-breakpoint
CREATE TYPE "public"."tipo_actividad" AS ENUM('global', 'extra');--> statement-breakpoint
CREATE TABLE "alumno" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"carne" text,
	"nombre" text,
	"rol" "rol" DEFAULT 'alumno' NOT NULL,
	"estado" "estado_alumno" DEFAULT 'activo' NOT NULL,
	"perfil_completo" boolean DEFAULT false NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "alumno_email_unique" UNIQUE("email"),
	CONSTRAINT "alumno_carne_unique" UNIQUE("carne")
);
--> statement-breakpoint
CREATE TABLE "docente" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nombre" text NOT NULL,
	"email" text NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clase" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codigo" text NOT NULL,
	"nombre" text NOT NULL,
	"docente_id" uuid NOT NULL,
	"seccion" text NOT NULL,
	"jornada" text NOT NULL,
	"ciclo" text NOT NULL,
	"activa" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inscripcion" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alumno_id" text NOT NULL,
	"clase_id" uuid NOT NULL,
	"inscrito_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inscripcion_alumno_id_clase_id_unique" UNIQUE("alumno_id","clase_id")
);
--> statement-breakpoint
CREATE TABLE "actividad" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codigo_corto" text NOT NULL,
	"nombre" text NOT NULL,
	"descripcion" text,
	"lugar" text,
	"tipo" "tipo_actividad" NOT NULL,
	"puntos" integer NOT NULL,
	"inicia_en" timestamp with time zone NOT NULL,
	"termina_en" timestamp with time zone NOT NULL,
	"marcaje_abre_en" timestamp with time zone NOT NULL,
	"marcaje_cierra_en" timestamp with time zone NOT NULL,
	"estado" "estado_actividad" DEFAULT 'borrador' NOT NULL,
	"secreto_qr" "bytea" NOT NULL,
	"ventana_seg" integer DEFAULT 60 NOT NULL,
	CONSTRAINT "actividad_codigo_corto_unique" UNIQUE("codigo_corto")
);
--> statement-breakpoint
CREATE TABLE "asistencia" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alumno_id" text NOT NULL,
	"actividad_id" uuid NOT NULL,
	"marcada_en" timestamp with time zone DEFAULT now() NOT NULL,
	"slot" bigint NOT NULL,
	"origen" "origen_asistencia" NOT NULL,
	"nota_manual" text,
	"ip" "inet",
	"dispositivo_id" text,
	"user_agent" text,
	"clases_snapshot" uuid[],
	CONSTRAINT "asistencia_alumno_id_actividad_id_unique" UNIQUE("alumno_id","actividad_id")
);
--> statement-breakpoint
CREATE TABLE "asignacion_extra" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alumno_id" text NOT NULL,
	"actividad_id" uuid NOT NULL,
	"clase_id" uuid NOT NULL,
	"puntos" integer NOT NULL,
	"creada_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pantalla" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actividad_id" uuid NOT NULL,
	"clave" text NOT NULL,
	"creada_en" timestamp with time zone DEFAULT now() NOT NULL,
	"activa" boolean DEFAULT true NOT NULL,
	CONSTRAINT "pantalla_clave_unique" UNIQUE("clave")
);
--> statement-breakpoint
CREATE TABLE "bitacora" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alumno_id" text NOT NULL,
	"actividad_id" uuid,
	"evento" "evento_bitacora" NOT NULL,
	"resultado" "resultado_bitacora",
	"ocurrio_en" timestamp with time zone DEFAULT now() NOT NULL,
	"ip" "inet",
	"dispositivo_id" text
);
--> statement-breakpoint
ALTER TABLE "clase" ADD CONSTRAINT "clase_docente_id_docente_id_fk" FOREIGN KEY ("docente_id") REFERENCES "public"."docente"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inscripcion" ADD CONSTRAINT "inscripcion_alumno_id_alumno_id_fk" FOREIGN KEY ("alumno_id") REFERENCES "public"."alumno"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inscripcion" ADD CONSTRAINT "inscripcion_clase_id_clase_id_fk" FOREIGN KEY ("clase_id") REFERENCES "public"."clase"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asistencia" ADD CONSTRAINT "asistencia_alumno_id_alumno_id_fk" FOREIGN KEY ("alumno_id") REFERENCES "public"."alumno"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asistencia" ADD CONSTRAINT "asistencia_actividad_id_actividad_id_fk" FOREIGN KEY ("actividad_id") REFERENCES "public"."actividad"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asignacion_extra" ADD CONSTRAINT "asignacion_extra_alumno_id_alumno_id_fk" FOREIGN KEY ("alumno_id") REFERENCES "public"."alumno"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asignacion_extra" ADD CONSTRAINT "asignacion_extra_actividad_id_actividad_id_fk" FOREIGN KEY ("actividad_id") REFERENCES "public"."actividad"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asignacion_extra" ADD CONSTRAINT "asignacion_extra_clase_id_clase_id_fk" FOREIGN KEY ("clase_id") REFERENCES "public"."clase"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pantalla" ADD CONSTRAINT "pantalla_actividad_id_actividad_id_fk" FOREIGN KEY ("actividad_id") REFERENCES "public"."actividad"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bitacora" ADD CONSTRAINT "bitacora_alumno_id_alumno_id_fk" FOREIGN KEY ("alumno_id") REFERENCES "public"."alumno"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bitacora" ADD CONSTRAINT "bitacora_actividad_id_actividad_id_fk" FOREIGN KEY ("actividad_id") REFERENCES "public"."actividad"("id") ON DELETE no action ON UPDATE no action;