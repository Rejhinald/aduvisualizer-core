import { Context } from "hono"
import { db } from "../../../config/db"
import { snapshots } from "../../../schema"
import { eq } from "drizzle-orm"
import { successResponse, failedResponse } from "../../../utils/response/helpers"

/**
 * GET /api/v2/snapshots/:snapshotId
 * Get a snapshot with full data
 */
export async function getSnapshotHandler(c: Context) {
  try {
    const snapshotId = c.req.param("snapshotId")
    if (!snapshotId) {
      return c.json(failedResponse(c, { message: "Snapshot ID is required" }), 400)
    }

    const [snapshot] = await db
      .select()
      .from(snapshots)
      .where(eq(snapshots.id, snapshotId))
      .limit(1)

    if (!snapshot) {
      return c.json(failedResponse(c, { message: "Snapshot not found" }), 404)
    }

    return c.json(successResponse(c, { data: snapshot, message: "Snapshot retrieved" }))
  } catch (error) {
    console.error("Error getting snapshot:", error)
    return c.json(failedResponse(c, { message: "Failed to get snapshot" }), 500)
  }
}
