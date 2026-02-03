import type { Context } from "hono"
import { db } from "../../../config/db"
import { snapshots, projects } from "../../../schema"
import { eq, and } from "drizzle-orm"
import { successResponse, failedResponse, formatZodErrors } from "../../../utils/response/helpers"
import { z } from "zod"

// Schema for creating a snapshot
const CreateSnapshotSchema = z.object({
  projectId: z.string().uuid(),
  blueprintId: z.string().uuid().optional(),
  type: z.enum(["auto", "manual"]),
  label: z.string().max(255).optional(),
  sessionId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  data: z.object({
    rooms: z.array(z.object({
      id: z.string(),
      name: z.string(),
      type: z.string(),
      color: z.string(),
      vertices: z.array(z.object({ x: z.number(), y: z.number() })),
      area: z.number(),
      description: z.string().optional(),
    })),
    doors: z.array(z.object({
      id: z.string(),
      type: z.string(),
      position: z.object({ x: z.number(), y: z.number() }),
      width: z.number(),
      height: z.number().optional(),
      rotation: z.number(),
    })),
    windows: z.array(z.object({
      id: z.string(),
      type: z.string(),
      position: z.object({ x: z.number(), y: z.number() }),
      width: z.number(),
      height: z.number(),
      rotation: z.number(),
    })),
    furniture: z.array(z.object({
      id: z.string(),
      type: z.string(),
      position: z.object({ x: z.number(), y: z.number() }),
      width: z.number(),
      height: z.number(),
      rotation: z.number(),
    })),
    aduBoundary: z.array(z.object({ x: z.number(), y: z.number() })),
    // Editor view settings (optional for backward compatibility)
    editorSettings: z.object({
      showLotOverlay: z.boolean(),
      showSatelliteView: z.boolean(),
      showLotBoundary: z.boolean(),
      showGrid: z.boolean(),
      zoom: z.number(),
      panOffsetX: z.number(),
      panOffsetY: z.number(),
    }).optional(),
    // Lot data (optional for backward compatibility)
    // Using .nullish() to accept null, undefined, or string values
    lotData: z.object({
      parcelNumber: z.string().nullish(),
      address: z.string().nullish(),
      city: z.string().nullish(),
      state: z.string().nullish(),
      zipCode: z.string().nullish(),
      geoLat: z.number(),
      geoLng: z.number(),
      geoRotation: z.number(),
      boundaryVertices: z.array(z.object({ lat: z.number(), lng: z.number() })).nullish(),
      lotWidthFeet: z.number().nullish(),
      lotDepthFeet: z.number().nullish(),
      lotAreaSqFt: z.number().nullish(),
      aduOffsetX: z.number(),
      aduOffsetY: z.number(),
      aduRotation: z.number(),
      setbackFrontFeet: z.number(),
      setbackBackFeet: z.number(),
      setbackLeftFeet: z.number(),
      setbackRightFeet: z.number(),
      dataSource: z.string().nullish(),
    }).optional(),
  }),
})

export async function createSnapshotHandler(c: Context) {
  try {
    const body = await c.req.json()
    const parsed = CreateSnapshotSchema.safeParse(body)

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

    // Create snapshot
    const [snapshot] = await db
      .insert(snapshots)
      .values({
        projectId: data.projectId,
        blueprintId: data.blueprintId,
        type: data.type,
        label: data.label,
        sessionId: data.sessionId,
        userId: data.userId,
        data: data.data,
        roomCount: String(data.data.rooms.length),
        doorCount: String(data.data.doors.length),
        windowCount: String(data.data.windows.length),
        furnitureCount: String(data.data.furniture.length),
      })
      .returning()

    return c.json(
      successResponse(c, {
        data: {
          snapshot: {
            id: snapshot.id,
            projectId: snapshot.projectId,
            blueprintId: snapshot.blueprintId,
            type: snapshot.type,
            label: snapshot.label,
            roomCount: snapshot.roomCount,
            doorCount: snapshot.doorCount,
            windowCount: snapshot.windowCount,
            furnitureCount: snapshot.furnitureCount,
            createdAt: snapshot.createdAt,
          },
        },
        message: `${data.type === 'auto' ? 'Auto-save' : 'Manual save'} snapshot created successfully`,
      }),
      201
    )
  } catch (e) {
    console.error("Create snapshot error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to create snapshot",
        error: { message: String(e) },
      }),
      500
    )
  }
}
