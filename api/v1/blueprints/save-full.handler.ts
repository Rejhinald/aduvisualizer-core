import type { Context } from "hono"
import { db } from "../../../config/db"
import { blueprints, rooms, doors, windows, furniture, projects } from "../../../schema"
import { eq, and } from "drizzle-orm"
import { successResponse, failedResponse, formatZodErrors } from "../../../utils/response/helpers"
import { z } from "zod"

/**
 * Vertex schema - a point in canvas pixels
 */
const VertexSchema = z.object({
  x: z.number(),
  y: z.number(),
})

/**
 * Room schema
 */
const RoomSchema = z.object({
  id: z.string().uuid().optional(),  // Optional for new rooms
  name: z.string(),
  type: z.enum(["bedroom", "bathroom", "kitchen", "living", "dining", "corridor", "other"]),
  description: z.string().optional(),
  color: z.string().optional(),
  vertices: z.array(VertexSchema).min(3),  // At least 3 points for a polygon
  areaSqFt: z.number(),
  rotation: z.number().optional(),
})

/**
 * Door schema
 */
const DoorSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(["single", "double", "sliding", "french", "open_passage"]),
  x: z.number(),
  y: z.number(),
  widthFeet: z.number(),
  rotation: z.number().optional(),
  isExterior: z.boolean().optional(),
})

/**
 * Window schema
 */
const WindowSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(["standard", "bay", "picture", "sliding"]),
  x: z.number(),
  y: z.number(),
  widthFeet: z.number(),
  heightFeet: z.number(),
  rotation: z.number().optional(),
})

/**
 * Furniture schema
 */
const FurnitureSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.string(),
  category: z.enum(["bedroom", "bathroom", "kitchen", "living", "office"]),
  name: z.string().optional(),
  x: z.number(),
  y: z.number(),
  widthFeet: z.number(),
  heightFeet: z.number(),
  rotation: z.number().optional(),
})

/**
 * Full blueprint save schema
 */
const SaveBlueprintSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().optional(),

  // Canvas configuration
  canvasWidth: z.number().default(800),
  canvasHeight: z.number().default(800),
  pixelsPerFoot: z.number().default(100),
  maxCanvasFeet: z.number().default(36),
  gridSize: z.number().default(100),

  // ADU boundary
  aduBoundary: z.array(VertexSchema).min(3),
  aduAreaSqFt: z.number(),

  // All elements
  rooms: z.array(RoomSchema),
  doors: z.array(DoorSchema),
  windows: z.array(WindowSchema),
  furniture: z.array(FurnitureSchema).optional().default([]),

  // Calculated totals
  totalRoomAreaSqFt: z.number().optional(),

  // Validation
  isValid: z.boolean().optional(),
  validationErrors: z.array(z.string()).optional(),
})

export async function saveFullBlueprintHandler(c: Context) {
  try {
    const body = await c.req.json()
    const parsed = SaveBlueprintSchema.safeParse(body)

    if (!parsed.success) {
      return c.json(
        failedResponse(c, {
          message: "Validation failed",
          error: formatZodErrors(parsed.error),
        }),
        400
      )
    }

    const data = parsed.data

    // Verify project exists
    const [project] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, data.projectId), eq(projects.isDeleted, false)))
      .limit(1)

    if (!project) {
      return c.json(
        failedResponse(c, { message: "Project not found" }),
        404
      )
    }

    // Calculate total room area if not provided
    const totalArea = data.totalRoomAreaSqFt ?? data.rooms.reduce((sum, r) => sum + r.areaSqFt, 0)

    // Get next version number
    const existingBlueprints = await db
      .select({ version: blueprints.version })
      .from(blueprints)
      .where(eq(blueprints.projectId, data.projectId))
      .orderBy(blueprints.version)

    const nextVersion = existingBlueprints.length > 0
      ? Math.max(...existingBlueprints.map(b => b.version ?? 0)) + 1
      : 1

    // Start transaction
    // Create blueprint
    const [blueprint] = await db
      .insert(blueprints)
      .values({
        projectId: data.projectId,
        version: nextVersion,
        name: data.name ?? `Version ${nextVersion}`,
        canvasWidth: data.canvasWidth,
        canvasHeight: data.canvasHeight,
        pixelsPerFoot: data.pixelsPerFoot,
        maxCanvasFeet: data.maxCanvasFeet,
        gridSize: data.gridSize,
        aduBoundary: data.aduBoundary,
        aduAreaSqFt: data.aduAreaSqFt,
        totalRoomAreaSqFt: totalArea,
        isValid: data.isValid ?? false,
        validationErrors: data.validationErrors,
      })
      .returning()

    // Insert rooms
    const insertedRooms = data.rooms.length > 0
      ? await db
          .insert(rooms)
          .values(
            data.rooms.map((r) => ({
              blueprintId: blueprint.id,
              name: r.name,
              type: r.type,
              description: r.description,
              color: r.color,
              vertices: r.vertices,
              areaSqFt: r.areaSqFt,
              rotation: r.rotation ?? 0,
            }))
          )
          .returning()
      : []

    // Insert doors
    const insertedDoors = data.doors.length > 0
      ? await db
          .insert(doors)
          .values(
            data.doors.map((d) => ({
              blueprintId: blueprint.id,
              type: d.type,
              x: d.x,
              y: d.y,
              widthFeet: d.widthFeet,
              rotation: d.rotation ?? 0,
              isExterior: d.isExterior ?? false,
            }))
          )
          .returning()
      : []

    // Insert windows
    const insertedWindows = data.windows.length > 0
      ? await db
          .insert(windows)
          .values(
            data.windows.map((w) => ({
              blueprintId: blueprint.id,
              type: w.type,
              x: w.x,
              y: w.y,
              widthFeet: w.widthFeet,
              heightFeet: w.heightFeet,
              rotation: w.rotation ?? 0,
            }))
          )
          .returning()
      : []

    // Insert furniture
    const insertedFurniture = data.furniture.length > 0
      ? await db
          .insert(furniture)
          .values(
            data.furniture.map((f) => ({
              blueprintId: blueprint.id,
              type: f.type,
              category: f.category,
              name: f.name,
              x: f.x,
              y: f.y,
              widthFeet: f.widthFeet,
              heightFeet: f.heightFeet,
              rotation: f.rotation ?? 0,
            }))
          )
          .returning()
      : []

    return c.json(
      successResponse(c, {
        data: {
          blueprint,
          rooms: insertedRooms,
          doors: insertedDoors,
          windows: insertedWindows,
          furniture: insertedFurniture,
          summary: {
            version: nextVersion,
            totalRooms: insertedRooms.length,
            totalDoors: insertedDoors.length,
            totalWindows: insertedWindows.length,
            totalFurniture: insertedFurniture.length,
            totalAreaSqFt: totalArea,
            aduAreaSqFt: data.aduAreaSqFt,
          },
        },
        message: `Blueprint v${nextVersion} saved successfully with all coordinates`,
      }),
      201
    )
  } catch (e) {
    console.error("Save blueprint error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to save blueprint",
        error: { message: String(e) },
      }),
      500
    )
  }
}
