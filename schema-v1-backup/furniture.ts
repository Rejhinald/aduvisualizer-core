import { pgTable, uuid, varchar, timestamp, boolean, doublePrecision, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { blueprints } from "./blueprints"

/**
 * Furniture Types by Category
 */
export const FURNITURE_TYPES = [
  // Bedroom
  "queen_bed",
  "king_bed",
  "twin_bed",
  "dresser",
  "nightstand",
  // Bathroom
  "toilet",
  "sink_vanity",
  "bathtub",
  "shower",
  // Kitchen
  "refrigerator",
  "stove",
  "sink",
  "dishwasher",
  "kitchen_island",
  // Living
  "sofa",
  "loveseat",
  "armchair",
  "coffee_table",
  "tv_stand",
  "dining_table",
  "dining_chair",
  // Office
  "desk",
  "office_chair",
  "bookshelf",
] as const

export type FurnitureType = (typeof FURNITURE_TYPES)[number]

export const FURNITURE_CATEGORIES = [
  "bedroom",
  "bathroom",
  "kitchen",
  "living",
  "office",
] as const

/**
 * Furniture - Furniture placements with precise positions
 */
export const furniture = pgTable("furniture", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  blueprintId: uuid("blueprint_id").references(() => blueprints.id).notNull(),

  // Furniture Type
  type: varchar("type", { length: 50 }).notNull(),
  category: varchar("category", { length: 50 }).notNull(),  // bedroom, bathroom, kitchen, living, office
  name: varchar("name", { length: 100 }),  // Optional custom name

  /**
   * Position - Center point of the furniture in CANVAS PIXELS
   */
  x: doublePrecision("x").notNull(),
  y: doublePrecision("y").notNull(),

  // Dimensions (in feet)
  widthFeet: doublePrecision("width_feet").notNull(),
  heightFeet: doublePrecision("height_feet").notNull(),  // Depth in floor plan view
  actualHeightFeet: doublePrecision("actual_height_feet"),  // 3D height (for visualization)

  // Rotation (degrees)
  rotation: doublePrecision("rotation").default(0),

  // Which room this furniture is in (optional)
  roomId: uuid("room_id"),

  // Z-order for rendering
  zIndex: integer("z_index").default(5),

  // Metadata
  isDeleted: boolean("is_deleted").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
})

export type Furniture = typeof furniture.$inferSelect
export type NewFurniture = typeof furniture.$inferInsert
