import { pgTable, uuid, varchar, timestamp, boolean, jsonb, doublePrecision, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { blueprints } from "./blueprints"

/**
 * Room Types Enum - LA ADU / California Building Code compliant
 */
export const ROOM_TYPES = [
  "bedroom",      // Bedroom (min 70 sq ft per CA Building Code)
  "bathroom",     // Full Bathroom (shower/tub, toilet, sink)
  "half_bath",    // Half Bath/Powder Room (toilet, sink only)
  "kitchen",      // Kitchen (required for ADU)
  "living",       // Living Room/Great Room
  "dining",       // Dining Area
  "closet",       // Closet/Wardrobe
  "laundry",      // Laundry Room/Area
  "storage",      // Storage Room
  "utility",      // Utility/Mechanical Room
  "entry",        // Entry/Foyer
  "corridor",     // Hallway/Corridor
  "flex",         // Flex Space/Den/Office
  "other",        // Other/Custom
] as const

export type RoomType = (typeof ROOM_TYPES)[number]

/**
 * Rooms - Individual rooms with precise vertex coordinates
 * Vertices define the polygon shape of each room
 */
export const rooms = pgTable("rooms", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  blueprintId: uuid("blueprint_id").references(() => blueprints.id).notNull(),

  // Room Info
  name: varchar("name", { length: 100 }).notNull(),  // e.g., "Bedroom 1", "Kitchen"
  type: varchar("type", { length: 50 }).notNull(),  // bedroom, bathroom, kitchen, living, dining, corridor, other
  description: varchar("description", { length: 500 }),  // For "other" type rooms

  // Color (hex code for display)
  color: varchar("color", { length: 20 }).default("#a8d5e5"),

  /**
   * Vertices - Array of {x, y} points in CANVAS PIXELS
   * These define the polygon corners of the room
   *
   * Example for a rectangular 10x12ft room at position (100, 100):
   * [
   *   { x: 100, y: 100 },    // Top-left
   *   { x: 1100, y: 100 },   // Top-right (100 + 10*100px)
   *   { x: 1100, y: 1300 },  // Bottom-right
   *   { x: 100, y: 1300 }    // Bottom-left
   * ]
   */
  vertices: jsonb("vertices").$type<Array<{ x: number; y: number }>>().notNull(),

  // Calculated dimensions (in feet)
  widthFeet: doublePrecision("width_feet"),
  heightFeet: doublePrecision("height_feet"),
  areaSqFt: doublePrecision("area_sqft").notNull(),

  // Rotation (degrees, 0 = no rotation)
  rotation: doublePrecision("rotation").default(0),

  // Z-order for rendering
  zIndex: integer("z_index").default(0),

  // Metadata
  isDeleted: boolean("is_deleted").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
})

export type Room = typeof rooms.$inferSelect
export type NewRoom = typeof rooms.$inferInsert
