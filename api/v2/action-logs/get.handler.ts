import { Context } from "hono"
import { db } from "../../../config/db"
import { actionLogs } from "../../../schema"
import { eq } from "drizzle-orm"
import { successResponse, failedResponse } from "../../../utils/response/helpers"

/**
 * GET /api/v2/action-logs/:logId
 * Get a specific action log with full state
 */
export async function getActionLogHandler(c: Context) {
  try {
    const logId = c.req.param("logId")
    if (!logId) {
      return c.json(failedResponse(c, { message: "Log ID is required" }), 400)
    }

    const [log] = await db
      .select()
      .from(actionLogs)
      .where(eq(actionLogs.id, logId))
      .limit(1)

    if (!log) {
      return c.json(failedResponse(c, { message: "Action log not found" }), 404)
    }

    return c.json(successResponse(c, { data: log, message: "Action log retrieved" }))
  } catch (error) {
    console.error("Error getting action log:", error)
    return c.json(failedResponse(c, { message: "Failed to get action log" }), 500)
  }
}
