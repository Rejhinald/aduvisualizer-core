import { pgTable, uuid, varchar, timestamp, boolean, doublePrecision, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { blueprints } from "./blueprints"

/**
 * Window Types
 */
export const WINDOW_TYPES = [
  "standard",   // Standard window (3x4ft)
  "bay",        // Bay window (6x5ft)
  "picture",    // Picture window (5x5ft)
  "sliding",    // Sliding window (4x3ft)
] as const

export type WindowType = (typeof WINDOW_TYPES)[number]

/**
 * Windows - Window placements with precise positions
 */
export const windows = pgTable("windows", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  blueprintId: uuid("blueprint_id").references(() => blueprints.id).notNull(),

  // Window Type
  type: varchar("type", { length: 50 }).notNull(),  // standard, bay, picture, sliding

  /**
   * Position - Center point of the window in CANVAS PIXELS
   */
  x: doublePrecision("x").notNull(),
  y: doublePrecision("y").notNull(),

  // Dimensions (in feet)
  widthFeet: doublePrecision("width_feet").notNull(),
  heightFeet: doublePrecision("height_feet").notNull(),

  // Vertical position (height from floor, in feet)
  sillHeightFeet: doublePrecision("sill_height_feet").default(3),

  // Rotation (degrees: 0, 90, 180, 270)
  rotation: doublePrecision("rotation").default(0),

  // Which room this window belongs to (optional)
  roomId: uuid("room_id"),

  // Z-order for rendering
  zIndex: integer("z_index").default(10),

  // Metadata
  isDeleted: boolean("is_deleted").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
})

export type Window = typeof windows.$inferSelect
export type NewWindow = typeof windows.$inferInsert
