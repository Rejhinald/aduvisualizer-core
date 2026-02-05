import { Context } from "hono"
import { db } from "../../../config/db"
import { windows } from "../../../schema"
import { eq } from "drizzle-orm"
import { successResponse, failedResponse } from "../../../utils/response/helpers"

/**
 * DELETE /api/v2/windows/:windowId
 * Delete a window
 */
export async function deleteWindowHandler(c: Context) {
  try {
    const windowId = c.req.param("windowId")
    if (!windowId) {
      return c.json(failedResponse(c, { message: "Window ID is required" }), 400)
    }

    const [deleted] = await db
      .delete(windows)
      .where(eq(windows.id, windowId))
      .returning()

    if (!deleted) {
      return c.json(failedResponse(c, { message: "Window not found" }), 404)
    }

    return c.json(successResponse(c, { data: { id: deleted.id }, message: "Window deleted" }))
  } catch (error) {
    console.error("Error deleting window:", error)
    return c.json(failedResponse(c, { message: "Failed to delete window" }), 500)
  }
}
