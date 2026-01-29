import { pgTable, uuid, varchar, timestamp, boolean, jsonb, text, doublePrecision, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { projects } from "./projects"

/**
 * Blueprints - Complete floor plan with all element coordinates
 * Each blueprint is a version/snapshot of the floor plan
 */
export const blueprints = pgTable("blueprints", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid("project_id").references(() => projects.id).notNull(),

  // Version tracking (for save history)
  version: integer("version").default(1).notNull(),
  name: varchar("name", { length: 255 }),  // Optional version name like "v1 - Initial", "v2 - Added bedroom"

  // Canvas Configuration (from frontend)
  canvasWidth: integer("canvas_width").default(800),  // Display width in pixels
  canvasHeight: integer("canvas_height").default(800),  // Display height in pixels
  pixelsPerFoot: doublePrecision("pixels_per_foot").default(100),
  maxCanvasFeet: integer("max_canvas_feet").default(36),
  gridSize: doublePrecision("grid_size").default(100),  // Grid cell size in pixels

  // ADU Boundary - Array of {x, y} points in canvas pixels
  // These define the overall ADU footprint
  aduBoundary: jsonb("adu_boundary").$type<Array<{ x: number; y: number }>>(),
  aduAreaSqFt: doublePrecision("adu_area_sqft"),

  // Total calculated area
  totalRoomAreaSqFt: doublePrecision("total_room_area_sqft"),

  // Validation status
  isValid: boolean("is_valid").default(false),
  validationErrors: jsonb("validation_errors").$type<string[]>(),

  // Metadata
  isDeleted: boolean("is_deleted").default(false).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
})

export type Blueprint = typeof blueprints.$inferSelect
export type NewBlueprint = typeof blueprints.$inferInsert
