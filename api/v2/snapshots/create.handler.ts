import { Context } from "hono"
import { z } from "zod"
import { db } from "../../../config/db"
import { snapshots, blueprints, corners, walls, doors, windows, furniture, lots } from "../../../schema"
import { eq } from "drizzle-orm"
import { successResponse, failedResponse, formatZodErrors } from "../../../utils/response/helpers"

const CreateSnapshotSchema = z.object({
  blueprintId: z.string().uuid(),
  description: z.string().max(255).optional(),
})

/**
 * POST /api/v2/snapshots
 * Create a snapshot of the current blueprint state
 */
export async function createSnapshotHandler(c: Context) {
  try {
    const body = await c.req.json()
    const parsed = CreateSnapshotSchema.safeParse(body)

    if (!parsed.success) {
      return c.json(failedResponse(c, { message: "Invalid snapshot data", error: formatZodErrors(parsed.error) }), 400)
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

    // Fetch current state
    const [
      currentCorners,
      currentWalls,
      currentDoors,
      currentWindows,
      currentFurniture,
      currentLot,
    ] = await Promise.all([
      db.select().from(corners).where(eq(corners.blueprintId, parsed.data.blueprintId)),
      db.select().from(walls).where(eq(walls.blueprintId, parsed.data.blueprintId)),
      db.select().from(doors),
      db.select().from(windows),
      db.select().from(furniture).where(eq(furniture.blueprintId, parsed.data.blueprintId)),
      db.select().from(lots).where(eq(lots.blueprintId, parsed.data.blueprintId)).limit(1).then((rows) => rows[0] ?? null),
    ])

    // Filter doors/windows to only those on our walls
    const wallIds = new Set(currentWalls.map((w) => w.id))
    const filteredDoors = currentDoors.filter((d) => wallIds.has(d.wallId))
    const filteredWindows = currentWindows.filter((w) => wallIds.has(w.wallId))

    // Create snapshot data
    const snapshotData = {
      corners: currentCorners,
      walls: currentWalls,
      doors: filteredDoors,
      windows: filteredWindows,
      furniture: currentFurniture,
      lot: currentLot,
      blueprintVersion: blueprint.version,
    }

    // Create snapshot
    const [snapshot] = await db
      .insert(snapshots)
      .values({
        blueprintId: parsed.data.blueprintId,
        description: parsed.data.description,
        data: snapshotData,
      })
      .returning()

    return c.json(successResponse(c, { data: snapshot, message: "Snapshot created" }), 201)
  } catch (error) {
    console.error("Error creating snapshot:", error)
    return c.json(failedResponse(c, { message: "Failed to create snapshot" }), 500)
  }
}
