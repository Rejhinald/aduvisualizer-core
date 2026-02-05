import { Context } from "hono"
import { db } from "../../../config/db"
import { snapshots } from "../../../schema"
import { eq, desc } from "drizzle-orm"
import { successResponse, failedResponse } from "../../../utils/response/helpers"

/**
 * GET /api/v2/snapshots/blueprint/:blueprintId
 * List all snapshots for a blueprint (newest first)
 */
export async function listSnapshotsHandler(c: Context) {
  try {
    const blueprintId = c.req.param("blueprintId")
    if (!blueprintId) {
      return c.json(failedResponse(c, { message: "Blueprint ID is required" }), 400)
    }

    // Return list without the full data (to save bandwidth)
    const result = await db
      .select({
        id: snapshots.id,
        blueprintId: snapshots.blueprintId,
        description: snapshots.description,
        createdAt: snapshots.createdAt,
      })
      .from(snapshots)
      .where(eq(snapshots.blueprintId, blueprintId))
      .orderBy(desc(snapshots.createdAt))

    return c.json(successResponse(c, { data: result, message: "Snapshots retrieved" }))
  } catch (error) {
    console.error("Error listing snapshots:", error)
    return c.json(failedResponse(c, { message: "Failed to list snapshots" }), 500)
  }
}
