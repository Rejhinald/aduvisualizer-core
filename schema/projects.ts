import { pgTable, uuid, varchar, timestamp, boolean, jsonb, text, doublePrecision } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

/**
 * ADU Projects - Main project container
 * Each project represents one ADU design with its lot location
 */
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),

  // Project Info
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),

  // Owner (optional - for when we add auth)
  userId: uuid("user_id"),

  // Lot Location - Geo Reference Point (center of the lot)
  // This is the anchor point for all blueprint coordinates
  geoLat: doublePrecision("geo_lat"),  // Latitude of lot center
  geoLng: doublePrecision("geo_lng"),  // Longitude of lot center
  geoRotation: doublePrecision("geo_rotation").default(0),  // Rotation in degrees (0 = north)

  // Lot Address (human readable)
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zip_code", { length: 20 }),
  country: varchar("country", { length: 100 }).default("USA"),

  // Scale Configuration
  // pixelsPerFoot from the frontend editor (default 100px = 1ft)
  pixelsPerFoot: doublePrecision("pixels_per_foot").default(100),

  // Lot Bounds (in feet from center point)
  lotWidthFeet: doublePrecision("lot_width_feet"),
  lotDepthFeet: doublePrecision("lot_depth_feet"),

  // Status
  status: varchar("status", { length: 50 }).default("draft"),  // draft, in_progress, completed, archived

  // Metadata
  isDeleted: boolean("is_deleted").default(false).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
  deletedAt: timestamp("deleted_at"),
})

export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
