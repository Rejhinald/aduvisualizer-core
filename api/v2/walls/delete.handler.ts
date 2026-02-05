import { Context } from "hono"
import { db } from "../../../config/db"
import { walls, doors, windows } from "../../../schema"
import { eq } from "drizzle-orm"
import { successResponse, failedResponse } from "../../../utils/response/helpers"

/**
 * DELETE /api/v2/walls/:wallId
 * Delete a wall (also deletes doors/windows on it)
 */
export async function deleteWallHandler(c: Context) {
  try {
    const wallId = c.req.param("wallId")
    if (!wallId) {
      return c.json(failedResponse(c, { message: "Wall ID is required" }), 400)
    }

    // Delete doors on this wall
    await db.delete(doors).where(eq(doors.wallId, wallId))

    // Delete windows on this wall
    await db.delete(windows).where(eq(windows.wallId, wallId))

    // Delete the wall
    const [deleted] = await db
      .delete(walls)
      .where(eq(walls.id, wallId))
      .returning()

    if (!deleted) {
      return c.json(failedResponse(c, { message: "Wall not found" }), 404)
    }

    return c.json(successResponse(c, { data: { id: deleted.id }, message: "Wall deleted (including doors and windows)" }))
  } catch (error) {
    console.error("Error deleting wall:", error)
    return c.json(failedResponse(c, { message: "Failed to delete wall" }), 500)
  }
}
