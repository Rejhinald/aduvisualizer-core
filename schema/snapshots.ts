import { pgTable, uuid, varchar, timestamp, boolean, jsonb, text } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"
import { projects } from "./projects"
import { blueprints } from "./blueprints"

/**
 * Snapshots - Local save points for quick restore
 * Stores complete state of rooms, doors, windows, furniture, and boundary
 * Used for version history / undo functionality
 */
export const snapshots = pgTable("snapshots", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid("project_id").references(() => projects.id).notNull(),
  blueprintId: uuid("blueprint_id").references(() => blueprints.id),

  // Snapshot metadata
  type: varchar("type", { length: 20 }).notNull(), // "auto" | "manual"
  label: varchar("label", { length: 255 }), // Optional user-provided label for manual saves

  // Complete state snapshot (stored as JSONB for efficiency)
  // This stores the entire editor state for quick restore
  data: jsonb("data").$type<{
    rooms: Array<{
      id: string;
      name: string;
      type: string;
      color: string;
      vertices: Array<{ x: number; y: number }>;
      area: number;
      description?: string;
    }>;
    doors: Array<{
      id: string;
      type: string;
      position: { x: number; y: number };
      width: number;
      height?: number;
      rotation: number;
    }>;
    windows: Array<{
      id: string;
      type: string;
      position: { x: number; y: number };
      width: number;
      height: number;
      rotation: number;
    }>;
    furniture: Array<{
      id: string;
      type: string;
      position: { x: number; y: number };
      width: number;
      height: number;
      rotation: number;
    }>;
    aduBoundary: Array<{ x: number; y: number }>;
    // Editor view settings (optional for backward compatibility)
    editorSettings?: {
      showLotOverlay: boolean;
      showSatelliteView: boolean;
      showLotBoundary: boolean;
      showGrid: boolean;
      zoom: number;
      panOffsetX: number;
      panOffsetY: number;
    };
    // Lot data (optional for backward compatibility)
    lotData?: {
      parcelNumber?: string;
      address?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      geoLat: number;
      geoLng: number;
      geoRotation: number;
      boundaryVertices?: Array<{ lat: number; lng: number }>;
      lotWidthFeet?: number;
      lotDepthFeet?: number;
      lotAreaSqFt?: number;
      aduOffsetX: number;
      aduOffsetY: number;
      aduRotation: number;
      setbackFrontFeet: number;
      setbackBackFeet: number;
      setbackLeftFeet: number;
      setbackRightFeet: number;
      dataSource?: string;
    };
  }>().notNull(),

  // Summary stats for display (avoids parsing JSONB just to show counts)
  roomCount: varchar("room_count", { length: 10 }),
  doorCount: varchar("door_count", { length: 10 }),
  windowCount: varchar("window_count", { length: 10 }),
  furnitureCount: varchar("furniture_count", { length: 10 }),

  // Session info (for auto-saves tracking)
  sessionId: uuid("session_id"),
  userId: uuid("user_id"),

  // Metadata
  isDeleted: boolean("is_deleted").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).default(sql`now()`).notNull(),
})

export type Snapshot = typeof snapshots.$inferSelect
export type NewSnapshot = typeof snapshots.$inferInsert
