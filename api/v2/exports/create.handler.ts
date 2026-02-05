import { Context } from "hono"
import { z } from "zod"
import { db } from "../../../config/db"
import { exports as exportsTable, blueprints, corners, walls, doors, windows, furniture, lots } from "../../../schema"
import { eq } from "drizzle-orm"
import { successResponse, failedResponse, formatZodErrors } from "../../../utils/response/helpers"
import { detectRooms, suggestRoomType, getFurnitureInRoom } from "../../../service/blueprint-engine"

const CreateExportSchema = z.object({
  blueprintId: z.string().uuid(),
  type: z.enum(["pdf", "png"]),
})

/**
 * POST /api/v2/exports
 * Create a new export (PDF or PNG)
 *
 * For now, this creates an export record and returns blueprint data
 * for client-side PDF generation. Server-side PDF generation can be
 * added later using puppeteer or similar.
 */
export async function createExportHandler(c: Context) {
  try {
    const body = await c.req.json()
    const parsed = CreateExportSchema.safeParse(body)

    if (!parsed.success) {
      return c.json(failedResponse(c, { message: "Invalid export data", error: formatZodErrors(parsed.error) }), 400)
    }

    // Verify blueprint exists
    const [blueprint] = await db
      .select()
      .from(blueprints)
      .where(eq(blueprints.id, parsed.data.blueprintId))
      .limit(1)

    if (!blueprint) {
      return c.json(failedResponse(c, { message: "Blueprint not found" }), 404)
    }

    // Fetch complete blueprint data
    const [
      savedCorners,
      savedWalls,
      savedDoors,
      savedWindows,
      savedFurniture,
      savedLot,
    ] = await Promise.all([
      db.select().from(corners).where(eq(corners.blueprintId, parsed.data.blueprintId)),
      db.select().from(walls).where(eq(walls.blueprintId, parsed.data.blueprintId)),
      db.select().from(doors),
      db.select().from(windows),
      db.select().from(furniture).where(eq(furniture.blueprintId, parsed.data.blueprintId)),
      db.select().from(lots).where(eq(lots.blueprintId, parsed.data.blueprintId)).limit(1).then((rows) => rows[0] ?? null),
    ])

    // Filter doors/windows to only those on our walls
    const wallIds = new Set(savedWalls.map((w) => w.id))
    const filteredDoors = savedDoors.filter((d) => wallIds.has(d.wallId))
    const filteredWindows = savedWindows.filter((w) => wallIds.has(w.wallId))

    // Detect rooms
    const computedRooms = detectRooms(savedCorners, savedWalls)
    const roomsWithTypes = computedRooms.map((room) => {
      const furnitureInRoom = getFurnitureInRoom(room, savedFurniture as any)
      const suggestedType = suggestRoomType(room, furnitureInRoom as any)
      return {
        ...room,
        type: suggestedType,
      }
    })

    // Create export record
    const [exportRecord] = await db
      .insert(exportsTable)
      .values({
        blueprintId: parsed.data.blueprintId,
        type: parsed.data.type,
        filePath: null, // Will be updated if server-side generation is added
      })
      .returning()

    // Return export record with blueprint data for client-side generation
    return c.json(successResponse(c, {
      data: {
        export: exportRecord,
        blueprint: {
          id: blueprint.id,
          projectId: blueprint.projectId,
          name: blueprint.name,
          version: blueprint.version,
          corners: savedCorners,
          walls: savedWalls,
          doors: filteredDoors,
          windows: filteredWindows,
          furniture: savedFurniture,
          rooms: roomsWithTypes,
          lot: savedLot,
          createdAt: blueprint.createdAt.toISOString(),
          updatedAt: blueprint.updatedAt.toISOString(),
        },
      },
      message: "Export created",
    }), 201)
  } catch (error) {
    console.error("Error creating export:", error)
    return c.json(failedResponse(c, { message: "Failed to create export" }), 500)
  }
}
