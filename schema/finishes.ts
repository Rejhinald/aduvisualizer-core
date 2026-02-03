import { pgTable, uuid, varchar, timestamp, boolean, jsonb, text } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { blueprints } from "./blueprints"

/**
 * Finishes - Material and style selections for the ADU
 */
export const finishes = pgTable("finishes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  blueprintId: uuid("blueprint_id").references(() => blueprints.id).notNull(),

  // Exterior
  exteriorSiding: varchar("exterior_siding", { length: 100 }),  // e.g., "wood_lap", "stucco", "vinyl"
  exteriorColor: varchar("exterior_color", { length: 50 }),  // Hex color or color name
  roofStyle: varchar("roof_style", { length: 50 }),  // flat, gable, hip, shed
  roofMaterial: varchar("roof_material", { length: 50 }),  // asphalt_shingle, metal, tile

  // Flooring by room type
  flooringSelections: jsonb("flooring_selections").$type<{
    bedroom?: string  // e.g., "hardwood_oak", "carpet_plush"
    bathroom?: string  // e.g., "tile_ceramic", "vinyl_luxury"
    kitchen?: string
    living?: string
    default?: string
  }>(),

  // Countertops
  kitchenCountertop: varchar("kitchen_countertop", { length: 100 }),  // granite, quartz, laminate
  bathroomCountertop: varchar("bathroom_countertop", { length: 100 }),

  // Cabinets
  cabinetStyle: varchar("cabinet_style", { length: 100 }),  // shaker, flat_panel, raised_panel
  cabinetColor: varchar("cabinet_color", { length: 50 }),

  // Fixtures
  fixtureFinish: varchar("fixture_finish", { length: 50 }),  // chrome, brushed_nickel, matte_black, brass

  // Windows & Doors
  windowStyle: varchar("window_style", { length: 50 }),  // single_hung, double_hung, casement
  windowFrameColor: varchar("window_frame_color", { length: 50 }),
  interiorDoorStyle: varchar("interior_door_style", { length: 50 }),  // panel, flush, shaker
  exteriorDoorStyle: varchar("exterior_door_style", { length: 50 }),

  // Walls
  wallColor: varchar("wall_color", { length: 50 }),
  accentWallColor: varchar("accent_wall_color", { length: 50 }),

  // Optional upgrades (JSON array of upgrade codes)
  upgrades: jsonb("upgrades").$type<string[]>(),  // ["smart_home", "solar_ready", "ev_charger"]

  // Style notes for AI (free text description)
  styleNotes: text("style_notes"),  // "Modern minimalist with warm wood tones"

  // Metadata
  isDeleted: boolean("is_deleted").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
})

export type Finish = typeof finishes.$inferSelect
export type NewFinish = typeof finishes.$inferInsert
