import { pgTable, uuid, doublePrecision, timestamp } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { blueprints } from "./blueprints"

/**
 * Corners v2 - The foundation of the blueprint graph
 * All coordinates are in FEET (decimal)
 * Walls connect corners, rooms are computed from enclosed loops
 */
export const corners = pgTable("corners", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  blueprintId: uuid("blueprint_id").references(() => blueprints.id, { onDelete: "cascade" }).notNull(),

  // Position in feet (decimal, e.g., 12.5 = 12' 6")
  x: doublePrecision("x").notNull(),
  y: doublePrecision("y").notNull(),

  // Optional elevation for multi-level (default 0)
  elevation: doublePrecision("elevation").default(0).notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
})

export type Corner = typeof corners.$inferSelect
export type NewCorner = typeof corners.$inferInsert
