ALTER TABLE "actividad" ADD COLUMN "lat" double precision;--> statement-breakpoint
ALTER TABLE "actividad" ADD COLUMN "lon" double precision;--> statement-breakpoint
ALTER TABLE "actividad" ADD COLUMN "radio_m" integer;--> statement-breakpoint
ALTER TABLE "asistencia" ADD COLUMN "lat" double precision;--> statement-breakpoint
ALTER TABLE "asistencia" ADD COLUMN "lon" double precision;--> statement-breakpoint
ALTER TABLE "asistencia" ADD COLUMN "precision_m" integer;--> statement-breakpoint
ALTER TABLE "asistencia" ADD COLUMN "distancia_m" integer;