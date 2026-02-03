import type { Context } from "hono"
import { db } from "../../../config/db"
import { snapshots } from "../../../schema"
import { eq, and, desc } from "drizzle-orm"
import { successResponse, failedResponse } from "../../../utils/response/helpers"

export async function listSnapshotsHandler(c: Context) {
  try {
    const projectId = c.req.param("projectId")
    const type = c.req.query("type") // Optional filter: "auto" | "manual"
    const limit = parseInt(c.req.query("limit") || "20", 10)

    if (!projectId) {
      return c.json(
        failedResponse(c, { message: "Project ID is required" }),
        400
      )
    }

    // Build query conditions
    const conditions = [
      eq(snapshots.projectId, projectId),
      eq(snapshots.isDeleted, false),
    ]

    if (type === "auto" || type === "manual") {
      conditions.push(eq(snapshots.type, type))
    }

    // Fetch snapshots (include data field for restore functionality)
    const snapshotList = await db
      .select()
      .from(snapshots)
      .where(and(...conditions))
      .orderBy(desc(snapshots.createdAt))
      .limit(limit)

    // Group by type for frontend convenience
    const autoSaves = snapshotList.filter(s => s.type === "auto")
    const manualSaves = snapshotList.filter(s => s.type === "manual")

    return c.json(
      successResponse(c, {
        data: {
          autoSaves,
          manualSaves,
          totalCount: snapshotList.length,
        },
        message: `Found ${snapshotList.length} snapshot(s)`,
      }),
      200
    )
  } catch (e) {
    console.error("List snapshots error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to list snapshots",
        error: { message: String(e) },
      }),
      500
    )
  }
}
