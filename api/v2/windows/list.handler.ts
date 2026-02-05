import { Context } from "hono"
import { db } from "../../../config/db"
import { windows } from "../../../schema"
import { eq } from "drizzle-orm"
import { successResponse, failedResponse } from "../../../utils/response/helpers"

/**
 * GET /api/v2/windows/wall/:wallId
 * List all windows on a wall
 */
export async function listWindowsHandler(c: Context) {
  try {
    const wallId = c.req.param("wallId")
    if (!wallId) {
      return c.json(failedResponse(c, { message: "Wall ID is required" }), 400)
    }

    const result = await db
      .select()
      .from(windows)
      .where(eq(windows.wallId, wallId))

    return c.json(successResponse(c, { data: result, message: "Windows retrieved" }))
  } catch (error) {
    console.error("Error listing windows:", error)
    return c.json(failedResponse(c, { message: "Failed to list windows" }), 500)
  }
}
