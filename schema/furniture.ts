import { pgTable, uuid, varchar, timestamp, doublePrecision } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { blueprints } from "./blueprints"

/**
 * Furniture Types
 */
export const FURNITURE_TYPES = [
  // Bedroom
  "bed_queen", "bed_king", "bed_twin", "dresser", "nightstand",
  // Bathroom
  "toilet", "sink", "bathtub", "shower",
  // Kitchen
  "refrigerator", "stove", "dishwasher", "kitchen_sink",
  // Living
  "sofa_3seat", "sofa_2seat", "armchair", "coffee_table", "dining_table", "dining_chair",
  // Office
  "desk", "office_chair", "bookshelf",
] as const

export type FurnitureType = (typeof FURNITURE_TYPES)[number]

/**
 * Furniture v2 - Free placement in feet coordinates
 */
export const furniture = pgTable("furniture", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  blueprintId: uuid("blueprint_id").references(() => blueprints.id, { onDelete: "cascade" }).notNull(),

  // Type
  type: varchar("type", { length: 50 }).notNull(),

  // Position in feet
  x: doublePrecision("x").notNull(),
  y: doublePrecision("y").notNull(),

  // Rotation in degrees
  rotation: doublePrecision("rotation").default(0).notNull(),

  // Dimensions in feet
  width: doublePrecision("width").notNull(),
  depth: doublePrecision("depth").notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
})

export type Furniture = typeof furniture.$inferSelect
export type NewFurniture = typeof furniture.$inferInsert
