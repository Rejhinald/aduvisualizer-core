import { Context } from "hono"
import { db } from "../../../config/db"
import { corners } from "../../../schema"
import { eq } from "drizzle-orm"
import { successResponse, failedResponse } from "../../../utils/response/helpers"

/**
 * GET /api/v2/blueprints/:blueprintId/corners
 * List all corners for a blueprint
 */
export async function listCornersHandler(c: Context) {
  try {
    const blueprintId = c.req.param("blueprintId")
    if (!blueprintId) {
      return c.json(failedResponse(c, { message: "Blueprint ID is required" }), 400)
    }

    const result = await db
      .select()
      .from(corners)
      .where(eq(corners.blueprintId, blueprintId))

    return c.json(successResponse(c, { data: result, message: "Corners retrieved" }))
  } catch (error) {
    console.error("Error listing corners:", error)
    return c.json(failedResponse(c, { message: "Failed to list corners" }), 500)
  }
}
