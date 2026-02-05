import { pgTable, uuid, varchar, timestamp, doublePrecision, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { walls } from "./walls"

/**
 * Door Types
 */
export const DOOR_TYPES = ["single", "double", "sliding", "french", "opening"] as const
export type DoorType = (typeof DOOR_TYPES)[number]

/**
 * Doors v2 - Placed on walls
 * Position is 0-1 ratio along the wall length
 */
export const doors = pgTable("doors", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  wallId: uuid("wall_id").references(() => walls.id, { onDelete: "cascade" }).notNull(),

  // Position along wall (0 = start corner, 1 = end corner, 0.5 = center)
  position: doublePrecision("position").notNull(),

  // Door type
  type: varchar("type", { length: 50 }).default("single").notNull(),

  // Dimensions in feet
  width: doublePrecision("width").default(3).notNull(),      // 3 feet standard
  height: doublePrecision("height").default(6.67).notNull(), // 6'8" standard

  // Orientation: 0-3 cycles through hinge left/right × swing direction
  // 0 = hinge left, swing down; 1 = hinge right, swing down
  // 2 = hinge right, swing up; 3 = hinge left, swing up
  orientation: integer("orientation").default(0).notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
})

export type Door = typeof doors.$inferSelect
export type NewDoor = typeof doors.$inferInsert
