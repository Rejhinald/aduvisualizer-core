/**
 * Finishes Schema - V1
 * Stores room finishes, camera placement, and render URLs
 */

import { pgTable, uuid, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core"
import { blueprints } from "./blueprints"

// Room finish type
export interface RoomFinish {
  roomId: string
  roomName: string
  roomType: string
  vibe: string
  tier: string
  lifestyle: string[]
  customNotes?: string
}

// Camera placement type
export interface CameraPlacement {
  position: { x: number; y: number }
  rotation: number
  fov: number
  height: number
}

// Render record type
export interface RenderRecord {
  id: string
  type: "topdown" | "firstperson"
  quality: "preview" | "final"
  url: string
  prompt?: string
  generatedAt: string
}

export const finishes = pgTable("finishes", {
  id: uuid("id").primaryKey().defaultRandom(),
  blueprintId: uuid("blueprint_id")
    .notNull()
    .references(() => blueprints.id, { onDelete: "cascade" }),

  // Global settings
  globalTemplate: text("global_template"),
  globalTier: text("global_tier").notNull().default("standard"),

  // Per-room finishes
  roomFinishes: jsonb("room_finishes").$type<RoomFinish[]>().default([]),

  // Camera placement for first-person renders
  cameraPlacement: jsonb("camera_placement").$type<CameraPlacement | null>(),

  // Render URLs
  topDownPreviewUrl: text("top_down_preview_url"),
  topDownFinalUrl: text("top_down_final_url"),
  firstPersonPreviewUrl: text("first_person_preview_url"),
  firstPersonFinalUrl: text("first_person_final_url"),

  // Render history
  renderHistory: jsonb("render_history").$type<RenderRecord[]>().default([]),

  // Metadata
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export type Finish = typeof finishes.$inferSelect
export type NewFinish = typeof finishes.$inferInsert
