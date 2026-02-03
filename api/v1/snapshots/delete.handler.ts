import type { Context } from "hono"
import { db } from "../../../config/db"
import { snapshots } from "../../../schema"
import { eq, and } from "drizzle-orm"
import { successResponse, failedResponse } from "../../../utils/response/helpers"

export async function deleteSnapshotHandler(c: Context) {
  try {
    const id = c.req.param("id")

    if (!id) {
      return c.json(
        failedResponse(c, { message: "Snapshot ID is required" }),
        400
      )
    }

    // Soft delete the snapshot
    const [deleted] = await db
      .update(snapshots)
      .set({ isDeleted: true })
      .where(and(eq(snapshots.id, id), eq(snapshots.isDeleted, false)))
      .returning({ id: snapshots.id })

    if (!deleted) {
      return c.json(
        failedResponse(c, { message: "Snapshot not found" }),
        404
      )
    }

    return c.json(
      successResponse(c, {
        data: { id: deleted.id },
        message: "Snapshot deleted successfully",
      }),
      200
    )
  } catch (e) {
    console.error("Delete snapshot error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to delete snapshot",
        error: { message: String(e) },
      }),
      500
    )
  }
}
