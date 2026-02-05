import { Context } from "hono"
import { db } from "../../../config/db"
import { doors } from "../../../schema"
import { eq } from "drizzle-orm"
import { successResponse, failedResponse } from "../../../utils/response/helpers"

/**
 * DELETE /api/v2/doors/:doorId
 * Delete a door
 */
export async function deleteDoorHandler(c: Context) {
  try {
    const doorId = c.req.param("doorId")
    if (!doorId) {
      return c.json(failedResponse(c, { message: "Door ID is required" }), 400)
    }

    const [deleted] = await db
      .delete(doors)
      .where(eq(doors.id, doorId))
      .returning()

    if (!deleted) {
      return c.json(failedResponse(c, { message: "Door not found" }), 404)
    }

    return c.json(successResponse(c, { data: { id: deleted.id }, message: "Door deleted" }))
  } catch (error) {
    console.error("Error deleting door:", error)
    return c.json(failedResponse(c, { message: "Failed to delete door" }), 500)
  }
}
