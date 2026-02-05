CREATE TABLE "boundary_corners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"blueprint_id" uuid NOT NULL,
	"x" double precision NOT NULL,
	"y" double precision NOT NULL,
	"order_index" double precision DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "boundary_walls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"blueprint_id" uuid NOT NULL,
	"start_corner_id" uuid NOT NULL,
	"end_corner_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "boundary_corners" ADD CONSTRAINT "boundary_corners_blueprint_id_blueprints_id_fk" FOREIGN KEY ("blueprint_id") REFERENCES "public"."blueprints"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boundary_walls" ADD CONSTRAINT "boundary_walls_blueprint_id_blueprints_id_fk" FOREIGN KEY ("blueprint_id") REFERENCES "public"."blueprints"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boundary_walls" ADD CONSTRAINT "boundary_walls_start_corner_id_boundary_corners_id_fk" FOREIGN KEY ("start_corner_id") REFERENCES "public"."boundary_corners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boundary_walls" ADD CONSTRAINT "boundary_walls_end_corner_id_boundary_corners_id_fk" FOREIGN KEY ("end_corner_id") REFERENCES "public"."boundary_corners"("id") ON DELETE cascade ON UPDATE no action;