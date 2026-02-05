import { Context } from "hono"
import { db } from "../../../config/db"
import { corners, walls } from "../../../schema"
import { eq, or } from "drizzle-orm"
import { successResponse, failedResponse } from "../../../utils/response/helpers"

/**
 * DELETE /api/v2/corners/:cornerId
 * Delete a corner (fails if walls are connected)
 */
export async function deleteCornerHandler(c: Context) {
  try {
    const cornerId = c.req.param("cornerId")
    if (!cornerId) {
      return c.json(failedResponse(c, { message: "Corner ID is required" }), 400)
    }

    // Check for connected walls
    const connectedWalls = await db
      .select({ id: walls.id })
      .from(walls)
      .where(
        or(
          eq(walls.startCornerId, cornerId),
          eq(walls.endCornerId, cornerId)
        )
      )
      .limit(1)

    if (connectedWalls.length > 0) {
      return c.json(failedResponse(c, { message: "Cannot delete corner with connected walls. Delete walls first." }), 409)
    }

    const [deleted] = await db
      .delete(corners)
      .where(eq(corners.id, cornerId))
      .returning()

    if (!deleted) {
      return c.json(failedResponse(c, { message: "Corner not found" }), 404)
    }

    return c.json(successResponse(c, { data: { id: deleted.id }, message: "Corner deleted" }))
  } catch (error) {
    console.error("Error deleting corner:", error)
    return c.json(failedResponse(c, { message: "Failed to delete corner" }), 500)
  }
}
