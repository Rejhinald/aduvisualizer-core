import { pgTable, uuid, varchar, timestamp, jsonb } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { blueprints } from "./blueprints"

/**
 * Action Logs v2 - Audit trail for all mutations
 */
export const actionLogs = pgTable("action_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  blueprintId: uuid("blueprint_id").references(() => blueprints.id, { onDelete: "cascade" }).notNull(),

  // Action details
  actionType: varchar("action_type", { length: 50 }).notNull(),  // create, update, delete
  entityType: varchar("entity_type", { length: 50 }).notNull(),  // corner, wall, door, window, furniture
  entityId: uuid("entity_id"),

  // State changes
  beforeState: jsonb("before_state"),
  afterState: jsonb("after_state"),

  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
})

export type ActionLog = typeof actionLogs.$inferSelect
export type NewActionLog = typeof actionLogs.$inferInsert
