import { Context } from "hono"
import { db } from "../../../config/db"
import { actionLogs } from "../../../schema"
import { eq, desc } from "drizzle-orm"
import { successResponse, failedResponse } from "../../../utils/response/helpers"

/**
 * GET /api/v2/action-logs/blueprint/:blueprintId
 * List all action logs for a blueprint (newest first)
 */
export async function listActionLogsHandler(c: Context) {
  try {
    const blueprintId = c.req.param("blueprintId")
    if (!blueprintId) {
      return c.json(failedResponse(c, { message: "Blueprint ID is required" }), 400)
    }

    // Get limit from query params (default 50)
    const limitParam = c.req.query("limit")
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 50

    const result = await db
      .select()
      .from(actionLogs)
      .where(eq(actionLogs.blueprintId, blueprintId))
      .orderBy(desc(actionLogs.createdAt))
      .limit(limit)

    return c.json(successResponse(c, { data: result, message: "Action logs retrieved" }))
  } catch (error) {
    console.error("Error listing action logs:", error)
    return c.json(failedResponse(c, { message: "Failed to list action logs" }), 500)
  }
}
