import { z } from "zod"

/**
 * Export format enum
 */
export const ExportFormatEnum = z.enum(["pdf", "png", "json"])
export type ExportFormat = z.infer<typeof ExportFormatEnum>

/**
 * Sheet size enum (architectural standard sizes)
 */
export const SheetSizeEnum = z.enum([
  "ARCH_D",  // 24" x 36" - Standard permit drawings
  "ARCH_C",  // 18" x 24" - Medium
  "LETTER",  // 8.5" x 11" - Personal/letter
  "A4",      // 210mm x 297mm - International
])
export type SheetSize = z.infer<typeof SheetSizeEnum>

/**
 * Scale enum (architectural scales)
 */
export const ScaleEnum = z.enum([
  "1/4",    // 1/4" = 1'-0"
  "1/8",    // 1/8" = 1'-0"
  "3/16",   // 3/16" = 1'-0"
  "1/16",   // 1/16" = 1'-0"
  "auto",   // Auto-fit to sheet
])
export type Scale = z.infer<typeof ScaleEnum>

/**
 * Export settings schema
 */
export const ExportSettingsSchema = z.object({
  format: ExportFormatEnum,
  sheetSize: SheetSizeEnum,
  scale: z.string(), // Can be enum value or custom
  dpi: z.number().min(72).max(600).default(300),
  includeSchedules: z.boolean().default(true),
  includeDimensions: z.boolean().default(true),
  includeNorthArrow: z.boolean().default(true),
  includeLegend: z.boolean().default(true),
  includeTitleBlock: z.boolean().default(true),
  includeLotOverlay: z.boolean().default(false),
  includeSatellite: z.boolean().default(false),
  projectName: z.string().min(1).max(255),
  preparedBy: z.string().max(255).default(""),
  address: z.string().max(500).default(""),
})

export type ExportSettingsInput = z.infer<typeof ExportSettingsSchema>

/**
 * Room schedule item schema
 */
export const RoomScheduleSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  area: z.number(),
  vertices: z.array(z.object({ x: z.number(), y: z.number() })),
})

/**
 * Door schedule item schema
 */
export const DoorScheduleSchema = z.object({
  id: z.string(),
  type: z.string(),
  position: z.object({ x: z.number(), y: z.number() }),
  rotation: z.number(),
  width: z.number(),
})

/**
 * Window schedule item schema
 */
export const WindowScheduleSchema = z.object({
  id: z.string(),
  type: z.string(),
  position: z.object({ x: z.number(), y: z.number() }),
  rotation: z.number(),
  width: z.number(),
  height: z.number(),
})

/**
 * Furniture schedule item schema
 */
export const FurnitureScheduleSchema = z.object({
  id: z.string(),
  type: z.string(),
  position: z.object({ x: z.number(), y: z.number() }),
  rotation: z.number(),
  width: z.number(),
  height: z.number(),
})

/**
 * Blueprint data snapshot schema
 */
export const BlueprintSnapshotSchema = z.object({
  rooms: z.array(RoomScheduleSchema),
  doors: z.array(DoorScheduleSchema),
  windows: z.array(WindowScheduleSchema),
  furniture: z.array(FurnitureScheduleSchema),
  aduBoundary: z.array(z.object({ x: z.number(), y: z.number() })),
  totalArea: z.number(),
  aduBoundaryArea: z.number(),
  lotData: z.object({
    address: z.string(),
    dimensions: z.string(),
    area: z.number(),
    setbacks: z.string(),
  }).optional(),
})

export type BlueprintSnapshotInput = z.infer<typeof BlueprintSnapshotSchema>

/**
 * Create PDF export request schema
 */
export const CreatePdfExportSchema = z.object({
  blueprintId: z.string().uuid(),
  canvasImage: z.string().min(1), // Base64 encoded PNG from Konva
  lotOverlayImage: z.string().optional(), // Base64 encoded PNG
  satelliteImage: z.string().optional(), // Base64 encoded PNG
  blueprintData: BlueprintSnapshotSchema,
  settings: ExportSettingsSchema,
})

export type CreatePdfExportInput = z.infer<typeof CreatePdfExportSchema>

/**
 * Create PNG export record schema (for tracking client-side exports)
 */
export const CreatePngExportSchema = z.object({
  blueprintId: z.string().uuid(),
  blueprintData: BlueprintSnapshotSchema,
  settings: ExportSettingsSchema.extend({
    format: z.literal("png"),
  }),
  fileSizeBytes: z.number().optional(),
})

export type CreatePngExportInput = z.infer<typeof CreatePngExportSchema>

/**
 * Create JSON export record schema (for tracking client-side exports)
 */
export const CreateJsonExportSchema = z.object({
  blueprintId: z.string().uuid(),
  blueprintData: BlueprintSnapshotSchema,
  settings: ExportSettingsSchema.extend({
    format: z.literal("json"),
  }),
  fileSizeBytes: z.number().optional(),
})

export type CreateJsonExportInput = z.infer<typeof CreateJsonExportSchema>

/**
 * List exports query schema
 */
export const ListExportsSchema = z.object({
  blueprintId: z.string().uuid(),
  format: ExportFormatEnum.optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
})

export type ListExportsInput = z.infer<typeof ListExportsSchema>

/**
 * Export response schema (what the API returns)
 */
export const ExportResponseSchema = z.object({
  id: z.string().uuid(),
  blueprintId: z.string().uuid(),
  format: ExportFormatEnum,
  fileName: z.string(),
  fileUrl: z.string().nullable(),
  fileSizeBytes: z.number().nullable(),
  settings: ExportSettingsSchema,
  pageCount: z.number().nullable(),
  sheetSize: z.string().nullable(),
  scale: z.string().nullable(),
  createdAt: z.string(),
  expiresAt: z.string().nullable(),
  isDeleted: z.boolean(),
})

export type ExportResponse = z.infer<typeof ExportResponseSchema>
