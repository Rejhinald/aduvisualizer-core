import { Context } from "hono"
import { db } from "../../../config/db"
import { walls } from "../../../schema"
import { eq } from "drizzle-orm"
import { successResponse, failedResponse } from "../../../utils/response/helpers"

/**
 * GET /api/v2/blueprints/:blueprintId/walls
 * List all walls for a blueprint
 */
export async function listWallsHandler(c: Context) {
  try {
    const blueprintId = c.req.param("blueprintId")
    if (!blueprintId) {
      return c.json(failedResponse(c, { message: "Blueprint ID is required" }), 400)
    }

    const result = await db
      .select()
      .from(walls)
      .where(eq(walls.blueprintId, blueprintId))

    return c.json(successResponse(c, { data: result, message: "Walls retrieved" }))
  } catch (error) {
    console.error("Error listing walls:", error)
    return c.json(failedResponse(c, { message: "Failed to list walls" }), 500)
  }
}
