import { pgTable, uuid, varchar, timestamp, boolean, doublePrecision, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { blueprints } from "./blueprints"

/**
 * Door Types
 */
export const DOOR_TYPES = [
  "single",       // Standard single door (3ft)
  "double",       // Double doors (6ft)
  "sliding",      // Sliding door (6ft)
  "french",       // French doors (5ft)
  "open_passage", // No door, just opening (4ft)
] as const

export type DoorType = (typeof DOOR_TYPES)[number]

/**
 * Doors - Door placements with precise positions
 */
export const doors = pgTable("doors", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  blueprintId: uuid("blueprint_id").references(() => blueprints.id).notNull(),

  // Door Type
  type: varchar("type", { length: 50 }).notNull(),  // single, double, sliding, french, open_passage

  /**
   * Position - Center point of the door in CANVAS PIXELS
   * x, y coordinates where the door is placed
   */
  x: doublePrecision("x").notNull(),
  y: doublePrecision("y").notNull(),

  // Dimensions (in feet)
  widthFeet: doublePrecision("width_feet").notNull(),  // Width of door opening
  heightFeet: doublePrecision("height_feet").default(6.67),  // Standard door height ~80in

  // Rotation (degrees: 0, 90, 180, 270)
  rotation: doublePrecision("rotation").default(0),

  // Which rooms this door connects (optional - for validation)
  connectsRoomId1: uuid("connects_room_id_1"),
  connectsRoomId2: uuid("connects_room_id_2"),

  // Is this an exterior door?
  isExterior: boolean("is_exterior").default(false),

  // Z-order for rendering
  zIndex: integer("z_index").default(10),

  // Metadata
  isDeleted: boolean("is_deleted").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
})

export type Door = typeof doors.$inferSelect
export type NewDoor = typeof doors.$inferInsert
