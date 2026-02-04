import { pgTable, uuid, varchar, timestamp, jsonb, text, doublePrecision } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { blueprints } from "./blueprints"

/**
 * Lots v2 - Property lot/parcel with boundary
 * Boundary can be from GIS or manually drawn (in feet)
 */
export const lots = pgTable("lots", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  blueprintId: uuid("blueprint_id").references(() => blueprints.id, { onDelete: "cascade" }).notNull(),

  // Address
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }).default("CA"),
  zipCode: varchar("zip_code", { length: 20 }),

  // Geographic center (for satellite imagery)
  geoLat: doublePrecision("geo_lat"),
  geoLng: doublePrecision("geo_lng"),

  // Lot boundary in feet (array of {x, y} points)
  // Can be from GIS conversion or manually drawn
  boundary: jsonb("boundary").$type<Array<{ x: number; y: number }>>(),

  // Setbacks in feet (LA ADU defaults)
  setbacks: jsonb("setbacks").$type<{
    front: number
    back: number
    left: number
    right: number
  }>().default({ front: 0, back: 4, left: 4, right: 4 }),

  // Data source
  source: varchar("source", { length: 50 }).default("manual"), // "gis", "manual"

  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
})

export type Lot = typeof lots.$inferSelect
export type NewLot = typeof lots.$inferInsert
