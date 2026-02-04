import { pgTable, uuid, varchar, timestamp, text } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { blueprints } from "./blueprints"

/**
 * Exports v2 - Generated export files (PDF, PNG)
 */
export const exports = pgTable("exports", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  blueprintId: uuid("blueprint_id").references(() => blueprints.id, { onDelete: "cascade" }).notNull(),

  // Export type
  type: varchar("type", { length: 20 }).notNull(),  // "pdf", "png"

  // File location
  filePath: text("file_path"),

  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
})

export type Export = typeof exports.$inferSelect
export type NewExport = typeof exports.$inferInsert
