import type { Context } from "hono"
import { db } from "../../../config/db"
import { snapshots } from "../../../schema"
import { eq, and } from "drizzle-orm"
import { successResponse, failedResponse } from "../../../utils/response/helpers"

export async function getSnapshotHandler(c: Context) {
  try {
    const id = c.req.param("id")

    if (!id) {
      return c.json(
        failedResponse(c, { message: "Snapshot ID is required" }),
        400
      )
    }

    // Fetch snapshot with full data
    const [snapshot] = await db
      .select()
      .from(snapshots)
      .where(and(eq(snapshots.id, id), eq(snapshots.isDeleted, false)))
      .limit(1)

    if (!snapshot) {
      return c.json(
        failedResponse(c, { message: "Snapshot not found" }),
        404
      )
    }

    return c.json(
      successResponse(c, {
        data: {
          snapshot,
        },
        message: "Snapshot retrieved successfully",
      }),
      200
    )
  } catch (e) {
    console.error("Get snapshot error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to get snapshot",
        error: { message: String(e) },
      }),
      500
    )
  }
}
