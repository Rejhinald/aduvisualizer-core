-- ADU Visualizer Database Schema
-- Run this in pgAdmin Query Tool after creating the 'aduvisualizer' database

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    user_id UUID,

    -- Geo Reference Point (center of the lot)
    geo_lat DOUBLE PRECISION,
    geo_lng DOUBLE PRECISION,
    geo_rotation DOUBLE PRECISION DEFAULT 0,

    -- Address
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',

    -- Scale
    pixels_per_foot DOUBLE PRECISION DEFAULT 100,
    lot_width_feet DOUBLE PRECISION,
    lot_depth_feet DOUBLE PRECISION,

    -- Status
    status VARCHAR(50) DEFAULT 'draft',

    -- Metadata
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    deleted_at TIMESTAMP
);

-- Blueprints table
CREATE TABLE IF NOT EXISTS blueprints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id),

    version INTEGER NOT NULL DEFAULT 1,
    name VARCHAR(255),

    -- Canvas config
    canvas_width INTEGER DEFAULT 800,
    canvas_height INTEGER DEFAULT 800,
    pixels_per_foot DOUBLE PRECISION DEFAULT 100,
    max_canvas_feet INTEGER DEFAULT 36,
    grid_size DOUBLE PRECISION DEFAULT 100,

    -- ADU Boundary (JSONB array of {x, y} points)
    adu_boundary JSONB,
    adu_area_sqft DOUBLE PRECISION,
    total_room_area_sqft DOUBLE PRECISION,

    -- Validation
    is_valid BOOLEAN DEFAULT false,
    validation_errors JSONB,

    -- Metadata
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id),

    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    description VARCHAR(500),
    color VARCHAR(20) DEFAULT '#a8d5e5',

    -- Vertices (JSONB array of {x, y} points in canvas pixels)
    vertices JSONB NOT NULL,

    -- Dimensions
    width_feet DOUBLE PRECISION,
    height_feet DOUBLE PRECISION,
    area_sqft DOUBLE PRECISION NOT NULL,
    rotation DOUBLE PRECISION DEFAULT 0,
    z_index INTEGER DEFAULT 0,

    -- Metadata
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Doors table
CREATE TABLE IF NOT EXISTS doors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id),

    type VARCHAR(50) NOT NULL,
    x DOUBLE PRECISION NOT NULL,
    y DOUBLE PRECISION NOT NULL,
    width_feet DOUBLE PRECISION NOT NULL,
    height_feet DOUBLE PRECISION DEFAULT 6.67,
    rotation DOUBLE PRECISION DEFAULT 0,

    connects_room_id_1 UUID,
    connects_room_id_2 UUID,
    is_exterior BOOLEAN DEFAULT false,
    z_index INTEGER DEFAULT 10,

    -- Metadata
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Windows table
CREATE TABLE IF NOT EXISTS windows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id),

    type VARCHAR(50) NOT NULL,
    x DOUBLE PRECISION NOT NULL,
    y DOUBLE PRECISION NOT NULL,
    width_feet DOUBLE PRECISION NOT NULL,
    height_feet DOUBLE PRECISION NOT NULL,
    sill_height_feet DOUBLE PRECISION DEFAULT 3,
    rotation DOUBLE PRECISION DEFAULT 0,

    room_id UUID,
    z_index INTEGER DEFAULT 10,

    -- Metadata
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Furniture table
CREATE TABLE IF NOT EXISTS furniture (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id),

    type VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    name VARCHAR(100),

    x DOUBLE PRECISION NOT NULL,
    y DOUBLE PRECISION NOT NULL,
    width_feet DOUBLE PRECISION NOT NULL,
    height_feet DOUBLE PRECISION NOT NULL,
    actual_height_feet DOUBLE PRECISION,
    rotation DOUBLE PRECISION DEFAULT 0,

    room_id UUID,
    z_index INTEGER DEFAULT 5,

    -- Metadata
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Finishes table
CREATE TABLE IF NOT EXISTS finishes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id),

    -- Exterior
    exterior_siding VARCHAR(100),
    exterior_color VARCHAR(50),
    roof_style VARCHAR(50),
    roof_material VARCHAR(50),

    -- Flooring
    flooring_selections JSONB,

    -- Countertops
    kitchen_countertop VARCHAR(100),
    bathroom_countertop VARCHAR(100),

    -- Cabinets
    cabinet_style VARCHAR(100),
    cabinet_color VARCHAR(50),

    -- Fixtures
    fixture_finish VARCHAR(50),

    -- Windows & Doors
    window_style VARCHAR(50),
    window_frame_color VARCHAR(50),
    interior_door_style VARCHAR(50),
    exterior_door_style VARCHAR(50),

    -- Walls
    wall_color VARCHAR(50),
    accent_wall_color VARCHAR(50),

    -- Upgrades
    upgrades JSONB,
    style_notes TEXT,

    -- Metadata
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Visualizations table
CREATE TABLE IF NOT EXISTS visualizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blueprint_id UUID NOT NULL REFERENCES blueprints(id),

    type VARCHAR(50) NOT NULL,
    name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',

    -- AI Prompt data
    prompt TEXT,
    prompt_data JSONB,

    -- Generated images
    image_url TEXT,
    thumbnail_url TEXT,

    -- Provider info
    provider VARCHAR(50) DEFAULT 'nanobanana',
    model_version VARCHAR(50),
    generation_time_ms INTEGER,
    error_message TEXT,

    -- Feedback
    rating INTEGER,
    feedback TEXT,

    -- Metadata
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_blueprints_project_id ON blueprints(project_id);
CREATE INDEX IF NOT EXISTS idx_rooms_blueprint_id ON rooms(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_doors_blueprint_id ON doors(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_windows_blueprint_id ON windows(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_furniture_blueprint_id ON furniture(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_finishes_blueprint_id ON finishes(blueprint_id);
CREATE INDEX IF NOT EXISTS idx_visualizations_blueprint_id ON visualizations(blueprint_id);

-- Success message
SELECT 'ADU Visualizer database schema created successfully!' as message;
