import { pgTable, uuid, varchar, timestamp, boolean, jsonb, text, doublePrecision } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { blueprints } from "./blueprints"

/**
 * Lots - Property lot/parcel data with boundary geometry
 * Used to overlay the ADU floor plan on the actual property lot
 * for 1:1 scale visualization and fit verification
 */
export const lots = pgTable("lots", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  blueprintId: uuid("blueprint_id").references(() => blueprints.id).notNull(),

  // Parcel identification (from county GIS)
  parcelNumber: varchar("parcel_number", { length: 50 }), // APN (Assessor's Parcel Number)

  // Address
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }).default("CA"),
  zipCode: varchar("zip_code", { length: 20 }),

  // Geographic center point (for coordinate conversion)
  geoLat: doublePrecision("geo_lat").notNull(),
  geoLng: doublePrecision("geo_lng").notNull(),
  geoRotation: doublePrecision("geo_rotation").default(0), // degrees, 0 = north

  // Lot boundary polygon vertices (in lat/lng coordinates)
  // These define the actual property boundary from GIS data
  boundaryVertices: jsonb("boundary_vertices").$type<Array<{ lat: number; lng: number }>>(),

  // Lot dimensions (in feet - calculated from boundary or entered manually)
  lotWidthFeet: doublePrecision("lot_width_feet"),
  lotDepthFeet: doublePrecision("lot_depth_feet"),
  lotAreaSqFt: doublePrecision("lot_area_sq_ft"),

  // ADU position on lot (in feet from lot center)
  // Used to position the ADU within the lot boundary
  aduOffsetX: doublePrecision("adu_offset_x").default(0),
  aduOffsetY: doublePrecision("adu_offset_y").default(0),
  aduRotation: doublePrecision("adu_rotation").default(0), // degrees

  // Setbacks (LA ADU defaults: 4ft rear/side, 0ft front)
  setbackFrontFeet: doublePrecision("setback_front_feet").default(0),
  setbackBackFeet: doublePrecision("setback_back_feet").default(4),
  setbackLeftFeet: doublePrecision("setback_left_feet").default(4),
  setbackRightFeet: doublePrecision("setback_right_feet").default(4),

  // Data source tracking
  dataSource: varchar("data_source", { length: 50 }), // "orange_county_gis", "manual", etc.

  // Metadata
  isDeleted: boolean("is_deleted").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).default(sql`now()`).notNull(),
})

export type Lot = typeof lots.$inferSelect
export type NewLot = typeof lots.$inferInsert
