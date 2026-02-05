import { Context } from "hono"
import { db } from "../../../config/db"
import { snapshots } from "../../../schema"
import { eq } from "drizzle-orm"
import { successResponse, failedResponse } from "../../../utils/response/helpers"

/**
 * DELETE /api/v2/snapshots/:snapshotId
 * Delete a snapshot
 */
export async function deleteSnapshotHandler(c: Context) {
  try {
    const snapshotId = c.req.param("snapshotId")
    if (!snapshotId) {
      return c.json(failedResponse(c, { message: "Snapshot ID is required" }), 400)
    }

    const [deleted] = await db
      .delete(snapshots)
      .where(eq(snapshots.id, snapshotId))
      .returning()

    if (!deleted) {
      return c.json(failedResponse(c, { message: "Snapshot not found" }), 404)
    }

    return c.json(successResponse(c, { data: { id: deleted.id }, message: "Snapshot deleted" }))
  } catch (error) {
    console.error("Error deleting snapshot:", error)
    return c.json(failedResponse(c, { message: "Failed to delete snapshot" }), 500)
  }
}
