-- Migration: Update finishes table from old schema to new vibe-based schema
-- This replaces the old material-based columns with the new vibe system

-- Drop old columns (they will be replaced by the new vibe-based system)
ALTER TABLE finishes DROP COLUMN IF EXISTS exterior_siding;
ALTER TABLE finishes DROP COLUMN IF EXISTS exterior_color;
ALTER TABLE finishes DROP COLUMN IF EXISTS roof_style;
ALTER TABLE finishes DROP COLUMN IF EXISTS roof_material;
ALTER TABLE finishes DROP COLUMN IF EXISTS flooring_selections;
ALTER TABLE finishes DROP COLUMN IF EXISTS kitchen_countertop;
ALTER TABLE finishes DROP COLUMN IF EXISTS bathroom_countertop;
ALTER TABLE finishes DROP COLUMN IF EXISTS cabinet_style;
ALTER TABLE finishes DROP COLUMN IF EXISTS cabinet_color;
ALTER TABLE finishes DROP COLUMN IF EXISTS fixture_finish;
ALTER TABLE finishes DROP COLUMN IF EXISTS window_style;
ALTER TABLE finishes DROP COLUMN IF EXISTS window_frame_color;
ALTER TABLE finishes DROP COLUMN IF EXISTS interior_door_style;
ALTER TABLE finishes DROP COLUMN IF EXISTS exterior_door_style;
ALTER TABLE finishes DROP COLUMN IF EXISTS wall_color;
ALTER TABLE finishes DROP COLUMN IF EXISTS accent_wall_color;
ALTER TABLE finishes DROP COLUMN IF EXISTS upgrades;
ALTER TABLE finishes DROP COLUMN IF EXISTS style_notes;

-- Add new vibe-based columns
ALTER TABLE finishes ADD COLUMN IF NOT EXISTS global_template varchar(50);
ALTER TABLE finishes ADD COLUMN IF NOT EXISTS global_tier varchar(20) DEFAULT 'standard' NOT NULL;
ALTER TABLE finishes ADD COLUMN IF NOT EXISTS room_finishes jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE finishes ADD COLUMN IF NOT EXISTS camera_placement jsonb;
ALTER TABLE finishes ADD COLUMN IF NOT EXISTS top_down_preview_url text;
ALTER TABLE finishes ADD COLUMN IF NOT EXISTS top_down_final_url text;
ALTER TABLE finishes ADD COLUMN IF NOT EXISTS first_person_preview_url text;
ALTER TABLE finishes ADD COLUMN IF NOT EXISTS first_person_final_url text;
ALTER TABLE finishes ADD COLUMN IF NOT EXISTS render_history jsonb DEFAULT '[]'::jsonb;
