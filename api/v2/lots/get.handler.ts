import { Context } from "hono"
import { db } from "../../../config/db"
import { lots } from "../../../schema"
import { eq } from "drizzle-orm"
import { successResponse, failedResponse } from "../../../utils/response/helpers"

/**
 * GET /api/v2/lots/blueprint/:blueprintId
 * Get lot for a blueprint
 */
export async function getLotHandler(c: Context) {
  try {
    const blueprintId = c.req.param("blueprintId")
    if (!blueprintId) {
      return c.json(failedResponse(c, { message: "Blueprint ID is required" }), 400)
    }

    const [lot] = await db
      .select()
      .from(lots)
      .where(eq(lots.blueprintId, blueprintId))
      .limit(1)

    if (!lot) {
      return c.json(successResponse(c, { data: null, message: "No lot found for blueprint" }))
    }

    return c.json(successResponse(c, { data: lot, message: "Lot retrieved" }))
  } catch (error) {
    console.error("Error getting lot:", error)
    return c.json(failedResponse(c, { message: "Failed to get lot" }), 500)
  }
}
