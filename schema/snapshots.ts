import { pgTable, uuid, varchar, timestamp, jsonb } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { blueprints } from "./blueprints"

/**
 * Snapshots v2 - Version history
 * Stores complete blueprint state as JSONB for quick restore
 */
export const snapshots = pgTable("snapshots", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  blueprintId: uuid("blueprint_id").references(() => blueprints.id, { onDelete: "cascade" }).notNull(),

  // Description (optional)
  description: varchar("description", { length: 255 }),

  // Complete state (corners, walls, doors, windows, furniture, lot)
  data: jsonb("data").notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
})

export type Snapshot = typeof snapshots.$inferSelect
export type NewSnapshot = typeof snapshots.$inferInsert
