import { pgTable, uuid, varchar, timestamp, boolean, jsonb, text, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { blueprints } from "./blueprints"

/**
 * Export settings stored in JSONB column
 */
export interface ExportSettings {
  format: "pdf" | "png" | "json"
  sheetSize: string // "ARCH_D", "ARCH_C", "LETTER", "A4"
  scale: string // "1/4", "1/8", "auto"
  dpi: number
  includeSchedules: boolean
  includeDimensions: boolean
  includeNorthArrow: boolean
  includeLegend: boolean
  includeTitleBlock: boolean
  includeLotOverlay: boolean
  includeSatellite: boolean
  projectName: string
  preparedBy: string
  address: string
}

/**
 * Blueprint data snapshot for export regeneration
 */
export interface BlueprintSnapshot {
  rooms: Array<{
    id: string
    name: string
    type: string
    area: number
    vertices: Array<{ x: number; y: number }>
  }>
  doors: Array<{
    id: string
    type: string
    position: { x: number; y: number }
    rotation: number
    width: number
  }>
  windows: Array<{
    id: string
    type: string
    position: { x: number; y: number }
    rotation: number
    width: number
    height: number
  }>
  furniture: Array<{
    id: string
    type: string
    position: { x: number; y: number }
    rotation: number
    width: number
    height: number
  }>
  aduBoundary: Array<{ x: number; y: number }>
  totalArea: number
  aduBoundaryArea: number
  lotData?: {
    address: string
    dimensions: string
    area: number
    setbacks: string
  }
}

/**
 * Exports - Track all blueprint exports (PDF, PNG, JSON)
 * Stores export history with settings and optional file references
 */
export const blueprintExports = pgTable("exports", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  blueprintId: uuid("blueprint_id").references(() => blueprints.id, { onDelete: "cascade" }).notNull(),

  // Export details
  format: varchar("format", { length: 10 }).notNull(), // "pdf", "png", "json"
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: text("file_url"), // Storage URL (optional - for cloud storage)
  fileSizeBytes: integer("file_size_bytes"),

  // Export settings (stored as JSONB for full reproducibility)
  settings: jsonb("settings").$type<ExportSettings>().notNull(),

  // Blueprint snapshot at export time (for regeneration)
  blueprintSnapshot: jsonb("blueprint_snapshot").$type<BlueprintSnapshot>(),

  // Metadata
  pageCount: integer("page_count"),
  sheetSize: varchar("sheet_size", { length: 20 }), // Denormalized for easy querying
  scale: varchar("scale", { length: 20 }), // Denormalized for easy querying

  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }), // Optional expiration for cleanup

  isDeleted: boolean("is_deleted").default(false).notNull(),
})

// Aliases for backwards compatibility
export { blueprintExports as exports }
export { blueprintExports as exportRecords }

export type BlueprintExport = typeof blueprintExports.$inferSelect
export type NewBlueprintExport = typeof blueprintExports.$inferInsert
export type Export = BlueprintExport
export type NewExport = NewBlueprintExport
