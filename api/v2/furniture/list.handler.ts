import { Context } from "hono"
import { db } from "../../../config/db"
import { furniture } from "../../../schema"
import { eq } from "drizzle-orm"
import { successResponse, failedResponse } from "../../../utils/response/helpers"

/**
 * GET /api/v2/furniture/blueprint/:blueprintId
 * List all furniture in a blueprint
 */
export async function listFurnitureHandler(c: Context) {
  try {
    const blueprintId = c.req.param("blueprintId")
    if (!blueprintId) {
      return c.json(failedResponse(c, { message: "Blueprint ID is required" }), 400)
    }

    const result = await db
      .select()
      .from(furniture)
      .where(eq(furniture.blueprintId, blueprintId))

    return c.json(successResponse(c, { data: result, message: "Furniture retrieved" }))
  } catch (error) {
    console.error("Error listing furniture:", error)
    return c.json(failedResponse(c, { message: "Failed to list furniture" }), 500)
  }
}
