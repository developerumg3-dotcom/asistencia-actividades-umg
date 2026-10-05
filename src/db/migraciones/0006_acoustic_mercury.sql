ALTER TYPE "public"."resultado_bitacora" ADD VALUE 'fuera_de_zona';--> statement-breakpoint
CREATE TABLE "suscripcion_push" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alumno_id" text NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"creada_en" timestamp with time zone DEFAULT now() NOT NULL,
	"ultimo_error_en" timestamp with time zone,
	CONSTRAINT "suscripcion_push_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
ALTER TABLE "actividad" ADD COLUMN "exige_ubicacion" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "suscripcion_push" ADD CONSTRAINT "suscripcion_push_alumno_id_alumno_id_fk" FOREIGN KEY ("alumno_id") REFERENCES "public"."alumno"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "suscripcion_push_alumno_idx" ON "suscripcion_push" USING btree ("alumno_id");