/**
 * Rooms Schema - V1 (stored rooms)
 * Note: In v2, rooms are computed by room-detector algorithm, not stored.
 * This schema is kept for v1 API backwards compatibility.
 */

import { pgTable, uuid, text, timestamp, boolean, real, jsonb } from "drizzle-orm/pg-core"
import { blueprints } from "./blueprints"

// Room type enum values
export const roomTypes = [
  "bedroom",
  "bathroom",
  "kitchen",
  "living",
  "dining",
  "corridor",
  "closet",
  "laundry",
  "storage",
  "utility",
  "entry",
  "flex",
  "other",
] as const

export type RoomType = (typeof roomTypes)[number]

// Vertex type for room polygon
export interface RoomVertex {
  x: number
  y: number
}

export const rooms = pgTable("rooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  blueprintId: uuid("blueprint_id")
    .notNull()
    .references(() => blueprints.id, { onDelete: "cascade" }),

  // Room info
  name: text("name").notNull(),
  type: text("type").notNull().$type<RoomType>(),
  description: text("description"),
  color: text("color"),

  // Geometry (in pixels - v1 used pixels)
  vertices: jsonb("vertices").$type<RoomVertex[]>().notNull(),
  areaSqFt: real("area_sq_ft").notNull(),
  widthFeet: real("width_feet"),
  heightFeet: real("height_feet"),
  rotation: real("rotation").default(0),

  // Metadata
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type Room = typeof rooms.$inferSelect
export type NewRoom = typeof rooms.$inferInsert
