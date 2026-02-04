import { pgTable, uuid, varchar, timestamp, doublePrecision } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { walls } from "./walls"

/**
 * Window Types
 */
export const WINDOW_TYPES = ["standard", "bay", "picture", "sliding"] as const
export type WindowType = (typeof WINDOW_TYPES)[number]

/**
 * Windows v2 - Placed on walls
 * Position is 0-1 ratio along the wall length
 */
export const windows = pgTable("windows", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  wallId: uuid("wall_id").references(() => walls.id, { onDelete: "cascade" }).notNull(),

  // Position along wall (0 = start corner, 1 = end corner, 0.5 = center)
  position: doublePrecision("position").notNull(),

  // Window type
  type: varchar("type", { length: 50 }).default("standard").notNull(),

  // Dimensions in feet
  width: doublePrecision("width").default(3).notNull(),
  height: doublePrecision("height").default(4).notNull(),
  sillHeight: doublePrecision("sill_height").default(3).notNull(), // 3 feet from floor

  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
})

export type Window = typeof windows.$inferSelect
export type NewWindow = typeof windows.$inferInsert
