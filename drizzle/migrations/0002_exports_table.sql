CREATE TABLE "exports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"blueprint_id" uuid NOT NULL,
	"format" varchar(10) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_url" text,
	"file_size_bytes" integer,
	"settings" jsonb NOT NULL,
	"blueprint_snapshot" jsonb,
	"page_count" integer,
	"sheet_size" varchar(20),
	"scale" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"is_deleted" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exports" ADD CONSTRAINT "exports_blueprint_id_blueprints_id_fk" FOREIGN KEY ("blueprint_id") REFERENCES "public"."blueprints"("id") ON DELETE no action ON UPDATE no action;
