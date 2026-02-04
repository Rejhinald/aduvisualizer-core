import { pgTable, uuid, varchar, timestamp, jsonb, boolean, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { projects } from "./projects"
import { blueprints } from "./blueprints"

/**
 * Action Logs Schema
 * Tracks all user actions in the floor plan editor for session replay and analytics
 */
export const actionLogs = pgTable("action_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),

  // Session tracking
  sessionId: uuid("session_id").notNull(), // Groups actions within a single editing session
  projectId: uuid("project_id").references(() => projects.id),
  blueprintId: uuid("blueprint_id").references(() => blueprints.id),

  // Action details
  action: varchar("action", { length: 100 }).notNull(), // e.g., "room.move", "window.resize", "furniture.rotate"
  entityType: varchar("entity_type", { length: 50 }).notNull(), // room, door, window, furniture, boundary
  entityId: uuid("entity_id"), // ID of the affected entity

  // State changes
  previousState: jsonb("previous_state").$type<Record<string, unknown>>(),
  newState: jsonb("new_state").$type<Record<string, unknown>>(),

  // Position/dimension changes (common fields for quick queries)
  positionX: integer("position_x"),
  positionY: integer("position_y"),
  width: integer("width"),
  height: integer("height"),
  rotation: integer("rotation"),

  // Metadata
  userId: uuid("user_id"), // For future auth integration
  requestId: varchar("request_id", { length: 36 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: varchar("user_agent", { length: 500 }),

  // Timestamps
  isDeleted: boolean("is_deleted").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
})

/**
 * Editor Sessions Schema
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
