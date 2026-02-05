/**
 * Visualizations Schema - V1
 * Stores AI-generated visualization records
 */

import { pgTable, uuid, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core"
import { blueprints } from "./blueprints"

// Visualization types
export const visualizationTypes = [
  "exterior_front",
  "exterior_back",
  "exterior_side",
  "exterior_aerial",
  "interior_living",
  "interior_bedroom",
  "interior_bathroom",
  "interior_kitchen",
  "floor_plan_3d",
  "custom",
] as const

export type VisualizationType = (typeof visualizationTypes)[number]

// Visualization status
export const visualizationStatuses = [
  "pending",
  "generating",
  "completed",
  "failed",
] as const

export type VisualizationStatus = (typeof visualizationStatuses)[number]

export const visualizations = pgTable("visualizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  blueprintId: uuid("blueprint_id")
    .notNull()
    .references(() => blueprints.id, { onDelete: "cascade" }),

  // Visualization info
  name: text("name").notNull(),
  type: text("type").notNull().$type<VisualizationType>(),
  status: text("status").notNull().$type<VisualizationStatus>().default("pending"),

  // Prompt data
  prompt: text("prompt"),
  promptData: jsonb("prompt_data"),

  // Generation info
  provider: text("provider"), // e.g., "nanobanana", "dalle", etc.
  generationId: text("generation_id"), // External provider ID

  // Result
  imageUrl: text("image_url"),
  thumbnailUrl: text("thumbnail_url"),
  errorMessage: text("error_message"),

  // Metadata
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  completedAt: timestamp("completed_at"),
})

export type Visualization = typeof visualizations.$inferSelect
export type NewVisualization = typeof visualizations.$inferInsert
