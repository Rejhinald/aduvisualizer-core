import { Context } from "hono"
import { db } from "../../../config/db"
import { furniture } from "../../../schema"
import { eq } from "drizzle-orm"
import { successResponse, failedResponse } from "../../../utils/response/helpers"

/**
 * DELETE /api/v2/furniture/:furnitureId
 * Delete furniture
 */
export async function deleteFurnitureHandler(c: Context) {
  try {
    const furnitureId = c.req.param("furnitureId")
    if (!furnitureId) {
      return c.json(failedResponse(c, { message: "Furniture ID is required" }), 400)
    }

    const [deleted] = await db
      .delete(furniture)
      .where(eq(furniture.id, furnitureId))
      .returning()

    if (!deleted) {
      return c.json(failedResponse(c, { message: "Furniture not found" }), 404)
    }

    return c.json(successResponse(c, { data: { id: deleted.id }, message: "Furniture deleted" }))
  } catch (error) {
    console.error("Error deleting furniture:", error)
    return c.json(failedResponse(c, { message: "Failed to delete furniture" }), 500)
  }
}
