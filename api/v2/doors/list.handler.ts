import { Context } from "hono"
import { db } from "../../../config/db"
import { doors } from "../../../schema"
import { eq } from "drizzle-orm"
import { successResponse, failedResponse } from "../../../utils/response/helpers"

/**
 * GET /api/v2/doors/wall/:wallId
 * List all doors on a wall
 */
export async function listDoorsHandler(c: Context) {
  try {
    const wallId = c.req.param("wallId")
    if (!wallId) {
      return c.json(failedResponse(c, { message: "Wall ID is required" }), 400)
    }

    const result = await db
      .select()
      .from(doors)
      .where(eq(doors.wallId, wallId))

    return c.json(successResponse(c, { data: result, message: "Doors retrieved" }))
  } catch (error) {
    console.error("Error listing doors:", error)
    return c.json(failedResponse(c, { message: "Failed to list doors" }), 500)
  }
}
