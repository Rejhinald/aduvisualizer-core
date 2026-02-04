import { pgTable, uuid, varchar, timestamp, boolean, jsonb, text, real } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { blueprints } from "./blueprints"

/**
 * Vibe options for room styling
 */
export type VibeOption =
  | "modern_minimal"
  | "scandinavian"
  | "industrial"
  | "bohemian"
  | "midcentury"
  | "coastal"
  | "farmhouse"
  | "luxury"

/**
 * Quality/price tier
 */
export type TierOption = "budget" | "standard" | "premium"

/**
 * Lifestyle options by room type
 */
export const LIFESTYLE_OPTIONS = {
  living: ["tv-setup", "gaming-corner", "reading-nook", "home-office"],
  bedroom: ["work-from-bed", "vanity-station", "reading-corner"],
  kitchen: ["coffee-bar", "breakfast-nook", "wine-storage"],
  dining: ["formal-setting", "casual-setting", "bar-cart"],
  bathroom: ["spa-vibes", "minimal-functional"],
  half_bath: ["minimal-functional"],
  // Utility/storage rooms get no lifestyle options
} as const

/**
 * Global template presets
 */
export type TemplateOption =
  | "builder_basic"
  | "modern_minimal"
  | "warm_contemporary"
  | "scandinavian_light"
  | "industrial_chic"
  | "coastal_casual"
  | "midcentury_modern"
  | "luxury_contemporary"

/**
 * Per-room finish selection
 */
export interface RoomFinish {
  roomId: string
  roomName: string
  roomType: string
  vibe: VibeOption
  tier: TierOption
  lifestyle: string[]
  customNotes?: string
}

/**
 * Camera placement for first-person renders
 */
export interface CameraPlacement {
  position: { x: number; y: number }
  rotation: number // degrees, 0 = facing right
  fov: 30 | 60 | 90
  height: number // feet (3-7 range typical)
}

/**
 * Render record for tracking generated images
 */
export interface RenderRecord {
  id: string
  type: "topdown" | "firstperson"
  quality: "preview" | "final"
  url: string
  prompt?: string
  generatedAt: string
}

/**
 * Finishes - Room-based style selections for ADU visualization
 */
export const finishes = pgTable("finishes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  blueprintId: uuid("blueprint_id").references(() => blueprints.id).notNull().unique(),

  // Global settings
  globalTemplate: varchar("global_template", { length: 50 }).$type<TemplateOption>(),
  globalTier: varchar("global_tier", { length: 20 }).$type<TierOption>().default("standard").notNull(),

  // Per-room finish selections
  roomFinishes: jsonb("room_finishes").$type<RoomFinish[]>().default([]).notNull(),

  // Camera placement for first-person renders
  cameraPlacement: jsonb("camera_placement").$type<CameraPlacement | null>(),

  // Generated renders
  topDownPreviewUrl: text("top_down_preview_url"),
  topDownFinalUrl: text("top_down_final_url"),
  firstPersonPreviewUrl: text("first_person_preview_url"),
  firstPersonFinalUrl: text("first_person_final_url"),

  // Render history (for regeneration/comparison)
  renderHistory: jsonb("render_history").$type<RenderRecord[]>().default([]),

  // Metadata
  isDeleted: boolean("is_deleted").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
})

export type Finish = typeof finishes.$inferSelect
export type NewFinish = typeof finishes.$inferInsert
