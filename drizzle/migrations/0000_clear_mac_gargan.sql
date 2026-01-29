CREATE TABLE "action_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"project_id" uuid,
	"blueprint_id" uuid,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid,
	"previous_state" jsonb,
	"new_state" jsonb,
	"position_x" integer,
	"position_y" integer,
	"width" integer,
	"height" integer,
	"rotation" integer,
	"user_id" uuid,
	"request_id" varchar(36),
	"ip_address" varchar(45),
	"user_agent" varchar(500),
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "editor_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid,
	"blueprint_id" uuid,
	"user_id" uuid,
	"ip_address" varchar(45),
	"user_agent" varchar(500),
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"action_count" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"last_activity_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "blueprints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"name" varchar(255),
	"canvas_width" integer DEFAULT 800,
	"canvas_height" integer DEFAULT 800,
	"pixels_per_foot" double precision DEFAULT 100,
	"max_canvas_feet" integer DEFAULT 36,
	"grid_size" double precision DEFAULT 100,
	"adu_boundary" jsonb,
	"adu_area_sqft" double precision,
	"total_room_area_sqft" double precision,
	"is_valid" boolean DEFAULT false,
	"validation_errors" jsonb,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"blueprint_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"x" double precision NOT NULL,
	"y" double precision NOT NULL,
	"width_feet" double precision NOT NULL,
	"height_feet" double precision DEFAULT 6.67,
	"rotation" double precision DEFAULT 0,
	"connects_room_id_1" uuid,
	"connects_room_id_2" uuid,
	"is_exterior" boolean DEFAULT false,
	"z_index" integer DEFAULT 10,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finishes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"blueprint_id" uuid NOT NULL,
	"exterior_siding" varchar(100),
	"exterior_color" varchar(50),
	"roof_style" varchar(50),
	"roof_material" varchar(50),
	"flooring_selections" jsonb,
	"kitchen_countertop" varchar(100),
	"bathroom_countertop" varchar(100),
	"cabinet_style" varchar(100),
	"cabinet_color" varchar(50),
	"fixture_finish" varchar(50),
	"window_style" varchar(50),
	"window_frame_color" varchar(50),
	"interior_door_style" varchar(50),
	"exterior_door_style" varchar(50),
	"wall_color" varchar(50),
	"accent_wall_color" varchar(50),
	"upgrades" jsonb,
	"style_notes" text,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "furniture" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"blueprint_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"category" varchar(50) NOT NULL,
	"name" varchar(100),
	"x" double precision NOT NULL,
	"y" double precision NOT NULL,
	"width_feet" double precision NOT NULL,
	"height_feet" double precision NOT NULL,
	"actual_height_feet" double precision,
	"rotation" double precision DEFAULT 0,
	"room_id" uuid,
	"z_index" integer DEFAULT 5,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"user_id" uuid,
	"geo_lat" double precision,
	"geo_lng" double precision,
	"geo_rotation" double precision DEFAULT 0,
	"address" text,
	"city" varchar(100),
	"state" varchar(50),
	"zip_code" varchar(20),
	"country" varchar(100) DEFAULT 'USA',
	"pixels_per_foot" double precision DEFAULT 100,
	"lot_width_feet" double precision,
	"lot_depth_feet" double precision,
	"status" varchar(50) DEFAULT 'draft',
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"blueprint_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" varchar(50) NOT NULL,
	"description" varchar(500),
	"color" varchar(20) DEFAULT '#a8d5e5',
	"vertices" jsonb NOT NULL,
	"width_feet" double precision,
	"height_feet" double precision,
	"area_sqft" double precision NOT NULL,
	"rotation" double precision DEFAULT 0,
	"z_index" integer DEFAULT 0,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "windows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"blueprint_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"x" double precision NOT NULL,
	"y" double precision NOT NULL,
	"width_feet" double precision NOT NULL,
	"height_feet" double precision NOT NULL,
	"sill_height_feet" double precision DEFAULT 3,
	"rotation" double precision DEFAULT 0,
	"room_id" uuid,
	"z_index" integer DEFAULT 10,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visualizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"blueprint_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"name" varchar(255),
	"status" varchar(50) DEFAULT 'pending',
	"prompt" text,
	"prompt_data" jsonb,
	"image_url" text,
	"thumbnail_url" text,
	"provider" varchar(50) DEFAULT 'nanobanana',
	"model_version" varchar(50),
	"generation_time_ms" integer,
	"error_message" text,
	"rating" integer,
	"feedback" text,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "action_logs" ADD CONSTRAINT "action_logs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_logs" ADD CONSTRAINT "action_logs_blueprint_id_blueprints_id_fk" FOREIGN KEY ("blueprint_id") REFERENCES "public"."blueprints"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "editor_sessions" ADD CONSTRAINT "editor_sessions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "editor_sessions" ADD CONSTRAINT "editor_sessions_blueprint_id_blueprints_id_fk" FOREIGN KEY ("blueprint_id") REFERENCES "public"."blueprints"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blueprints" ADD CONSTRAINT "blueprints_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doors" ADD CONSTRAINT "doors_blueprint_id_blueprints_id_fk" FOREIGN KEY ("blueprint_id") REFERENCES "public"."blueprints"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finishes" ADD CONSTRAINT "finishes_blueprint_id_blueprints_id_fk" FOREIGN KEY ("blueprint_id") REFERENCES "public"."blueprints"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "furniture" ADD CONSTRAINT "furniture_blueprint_id_blueprints_id_fk" FOREIGN KEY ("blueprint_id") REFERENCES "public"."blueprints"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_blueprint_id_blueprints_id_fk" FOREIGN KEY ("blueprint_id") REFERENCES "public"."blueprints"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "windows" ADD CONSTRAINT "windows_blueprint_id_blueprints_id_fk" FOREIGN KEY ("blueprint_id") REFERENCES "public"."blueprints"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visualizations" ADD CONSTRAINT "visualizations_blueprint_id_blueprints_id_fk" FOREIGN KEY ("blueprint_id") REFERENCES "public"."blueprints"("id") ON DELETE no action ON UPDATE no action;