import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { blueprints } from "./blueprints"
import { boundaryCorners } from "./boundary-corners"

/**
 * Boundary Walls - Connect boundary corners to form the ADU buildable area
 * Same schema concept as walls but for the boundary polygon edges
 * These are not rendered in 3D, only used for the 2D boundary guide
 */
export const boundaryWalls = pgTable("boundary_walls", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  blueprintId: uuid("blueprint_id").references(() => blueprints.id, { onDelete: "cascade" }).notNull(),

  // Wall connects two boundary corners
  startCornerId: uuid("start_corner_id").references(() => boundaryCorners.id, { onDelete: "cascade" }).notNull(),
  endCornerId: uuid("end_corner_id").references(() => boundaryCorners.id, { onDelete: "cascade" }).notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
})

export type BoundaryWall = typeof boundaryWalls.$inferSelect
export type NewBoundaryWall = typeof boundaryWalls.$inferInsert
