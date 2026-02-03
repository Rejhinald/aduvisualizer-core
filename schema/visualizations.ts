import { pgTable, uuid, varchar, timestamp, boolean, jsonb, text, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { blueprints } from "./blueprints"

/**
 * Visualization Types
 */
export const VISUALIZATION_TYPES = [
  "exterior_front",
  "exterior_back",
  "exterior_side",
  "exterior_aerial",
  "interior_living",
  "interior_bedroom",
  "interior_bathroom",
  "interior_kitchen",
  "floor_plan_3d",
  "custom",
] as const

export type VisualizationType = (typeof VISUALIZATION_TYPES)[number]

/**
 * Visualizations - AI-generated 3D renders
 */
export const visualizations = pgTable("visualizations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  blueprintId: uuid("blueprint_id").references(() => blueprints.id).notNull(),

  // Visualization Type
  type: varchar("type", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }),

  // Generation Status
  status: varchar("status", { length: 50 }).default("pending"),  // pending, generating, completed, failed

  // The prompt sent to the AI (stored for reproducibility)
  prompt: text("prompt"),

  // The full structured prompt data (coordinates, materials, etc.)
  promptData: jsonb("prompt_data").$type<{
    // Blueprint reference
    blueprintId: string
    // Geo coordinates for context
    geoLocation?: { lat: number; lng: number }
    // Room coordinates in real-world measurements
    rooms: Array<{
      name: string
      type: string
      vertices: Array<{ x: number; y: number }>  // In feet from origin
      area: number
    }>
    // Doors with positions
    doors: Array<{
      type: string
      position: { x: number; y: number }  // In feet from origin
      width: number
      rotation: number
    }>
    // Windows with positions
    windows: Array<{
      type: string
      position: { x: number; y: number }  // In feet from origin
      width: number
      height: number
      rotation: number
    }>
    // Furniture with positions
    furniture: Array<{
      type: string
      position: { x: number; y: number }  // In feet from origin
      width: number
      height: number
      rotation: number
    }>
    // Finishes/materials
    finishes?: Record<string, string>
    // View angle/type
    viewType: string
    // Style description
    styleDescription?: string
  }>(),

  // Generated image URLs
  imageUrl: text("image_url"),
  thumbnailUrl: text("thumbnail_url"),

  // AI provider info
  provider: varchar("provider", { length: 50 }).default("nanobanana"),  // nanobanana, dalle, midjourney
  modelVersion: varchar("model_version", { length: 50 }),

  // Generation metadata
  generationTimeMs: integer("generation_time_ms"),
  errorMessage: text("error_message"),

  // Rating/feedback
  rating: integer("rating"),  // 1-5 stars
  feedback: text("feedback"),

  // Metadata
  isDeleted: boolean("is_deleted").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
})

export type Visualization = typeof visualizations.$inferSelect
export type NewVisualization = typeof visualizations.$inferInsert
