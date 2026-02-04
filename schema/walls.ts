import { pgTable, uuid, doublePrecision, timestamp } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { blueprints } from "./blueprints"
import { corners } from "./corners"

/**
 * Walls v2 - Connect two corners
 * Walls have thickness and height (in feet)
 * Doors and windows are placed on walls
 */
export const walls = pgTable("walls", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  blueprintId: uuid("blueprint_id").references(() => blueprints.id, { onDelete: "cascade" }).notNull(),

  // Wall connects two corners
  startCornerId: uuid("start_corner_id").references(() => corners.id, { onDelete: "cascade" }).notNull(),
  endCornerId: uuid("end_corner_id").references(() => corners.id, { onDelete: "cascade" }).notNull(),

  // Dimensions in feet
  thickness: doublePrecision("thickness").default(0.5).notNull(),  // 6 inches default
  height: doublePrecision("height").default(9).notNull(),           // 9 feet default

  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
})

export type Wall = typeof walls.$inferSelect
export type NewWall = typeof walls.$inferInsert
