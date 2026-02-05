import { Context } from "hono"
import { db } from "../../../config/db"
import { lots } from "../../../schema"
import { eq } from "drizzle-orm"
import { successResponse, failedResponse } from "../../../utils/response/helpers"

/**
 * DELETE /api/v2/lots/:lotId
 * Delete a lot
 */
export async function deleteLotHandler(c: Context) {
  try {
    const lotId = c.req.param("lotId")
    if (!lotId) {
      return c.json(failedResponse(c, { message: "Lot ID is required" }), 400)
    }

    const [deleted] = await db
      .delete(lots)
      .where(eq(lots.id, lotId))
      .returning()

    if (!deleted) {
      return c.json(failedResponse(c, { message: "Lot not found" }), 404)
    }

    return c.json(successResponse(c, { data: { id: deleted.id }, message: "Lot deleted" }))
  } catch (error) {
    console.error("Error deleting lot:", error)
    return c.json(failedResponse(c, { message: "Failed to delete lot" }), 500)
  }
}
