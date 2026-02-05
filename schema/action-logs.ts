import { pgTable, uuid, varchar, timestamp, jsonb, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { blueprints } from "./blueprints"
import { projects } from "./projects"

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

/**
 * Editor Sessions - V1 backwards compatibility
 * Tracks editing sessions for grouping actions
 */
export const editorSessions = pgTable("editor_sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),

  projectId: uuid("project_id").references(() => projects.id),
  blueprintId: uuid("blueprint_id").references(() => blueprints.id),

  // Session info
  userId: uuid("user_id"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: varchar("user_agent", { length: 500 }),

  // Session state
  status: varchar("status", { length: 20 }).default("active").notNull(), // active, closed, expired
  actionCount: integer("action_count").default(0).notNull(),

  // Timestamps
  startedAt: timestamp("started_at", { withTimezone: true }).default(sql`now()`).notNull(),
  lastActivityAt: timestamp("last_activity_at", { withTimezone: true }).default(sql`now()`).notNull(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
})

export type EditorSession = typeof editorSessions.$inferSelect
export type NewEditorSession = typeof editorSessions.$inferInsert
