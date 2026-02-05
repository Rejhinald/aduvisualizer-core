import { pgTable, uuid, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { projects } from "./projects"

/**
 * Blueprints v2 - Floor plan container
 * Corners and walls define the geometry (no pixel/feet conversion needed)
 */
export const blueprints = pgTable("blueprints", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }),
  version: integer("version").default(1).notNull(),
  isDeleted: boolean("is_deleted").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
})

export type Blueprint = typeof blueprints.$inferSelect
export type NewBlueprint = typeof blueprints.$inferInsert
