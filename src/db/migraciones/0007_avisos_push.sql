CREATE TABLE "aviso_push" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clave" text NOT NULL,
	"tipo" text NOT NULL,
	"autor_id" text NOT NULL,
	"actividad_id" uuid,
	"titulo" text NOT NULL,
	"cuerpo" text NOT NULL,
	"url" text NOT NULL,
	"creada_en" timestamp with time zone DEFAULT now() NOT NULL,
	"programada_en" timestamp with time zone,
	"cancelada_en" timestamp with time zone,
	CONSTRAINT "aviso_push_clave_unique" UNIQUE("clave"),
	CONSTRAINT "aviso_push_tipo_valido" CHECK ("aviso_push"."tipo" in ('actividad', 'general', 'recordatorio'))
);
--> statement-breakpoint
CREATE TABLE "entrega_push" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"aviso_id" uuid NOT NULL,
	"suscripcion_id" uuid NOT NULL,
	"alumno_id" text NOT NULL,
	"estado" text DEFAULT 'pendiente' NOT NULL,
	"intentos" integer DEFAULT 0 NOT NULL,
	"reservada_en" timestamp with time zone,
	"aceptada_en" timestamp with time zone,
	"reintentar_en" timestamp with time zone,
	"codigo_error" integer,
	CONSTRAINT "entrega_push_aviso_suscripcion_unica" UNIQUE("aviso_id","suscripcion_id"),
	CONSTRAINT "entrega_push_estado_valido" CHECK ("entrega_push"."estado" in ('pendiente','procesando','aceptada','fallida','descartada','incierta')),
	CONSTRAINT "entrega_push_intentos_validos" CHECK ("entrega_push"."intentos" between 0 and 3)
);
--> statement-breakpoint
ALTER TABLE "aviso_push" ADD CONSTRAINT "aviso_push_autor_id_alumno_id_fk" FOREIGN KEY ("autor_id") REFERENCES "public"."alumno"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aviso_push" ADD CONSTRAINT "aviso_push_actividad_id_actividad_id_fk" FOREIGN KEY ("actividad_id") REFERENCES "public"."actividad"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entrega_push" ADD CONSTRAINT "entrega_push_aviso_id_aviso_push_id_fk" FOREIGN KEY ("aviso_id") REFERENCES "public"."aviso_push"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entrega_push" ADD CONSTRAINT "entrega_push_alumno_id_alumno_id_fk" FOREIGN KEY ("alumno_id") REFERENCES "public"."alumno"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "entrega_push_aviso_estado_idx" ON "entrega_push" USING btree ("aviso_id","estado");