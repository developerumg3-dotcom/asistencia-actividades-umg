ALTER TYPE "public"."resultado_bitacora" ADD VALUE 'sin_entrada';--> statement-breakpoint
ALTER TABLE "actividad" ADD COLUMN "doble_marcaje" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "actividad" ADD COLUMN "salida_abre_en" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "actividad" ADD COLUMN "salida_cierra_en" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "asistencia" ADD COLUMN "salida_en" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "asistencia" ADD COLUMN "slot_salida" bigint;