import { pgTable, uuid, doublePrecision, timestamp } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { blueprints } from "./blueprints"

/**
 * Boundary Corners - Define the ADU buildable area boundary
 * Same schema as corners but for the boundary polygon
 * These define the editable boundary shape, not rendered in 3D
 * Coordinates are in FEET (decimal)
 */
export const boundaryCorners = pgTable("boundary_corners", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  blueprintId: uuid("blueprint_id").references(() => blueprints.id, { onDelete: "cascade" }).notNull(),

  // Position in feet (decimal)
  x: doublePrecision("x").notNull(),
  y: doublePrecision("y").notNull(),

  // Order index for maintaining polygon vertex order
  orderIndex: doublePrecision("order_index").default(0).notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
})

export type BoundaryCorner = typeof boundaryCorners.$inferSelect
export type NewBoundaryCorner = typeof boundaryCorners.$inferInsert
