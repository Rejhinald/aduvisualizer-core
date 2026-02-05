import { Context } from "hono"
import { db } from "../../../config/db"
import { furniture } from "../../../schema"
import { eq } from "drizzle-orm"
import { UpdateFurnitureSchemaV2 } from "../../../types/blueprint-v2"
import { successResponse, failedResponse, formatZodErrors } from "../../../utils/response/helpers"

/**
 * PATCH /api/v2/furniture/:furnitureId
 * Update furniture properties
 */
export async function updateFurnitureHandler(c: Context) {
  try {
    const furnitureId = c.req.param("furnitureId")
    if (!furnitureId) {
      return c.json(failedResponse(c, { message: "Furniture ID is required" }), 400)
    }

    const body = await c.req.json()
    const parsed = UpdateFurnitureSchemaV2.safeParse(body)

    if (!parsed.success) {
      return c.json(failedResponse(c, { message: "Invalid furniture data", error: formatZodErrors(parsed.error) }), 400)
    }

    const updateData: Record<string, number> = {}
    if (parsed.data.x !== undefined) updateData.x = parsed.data.x
    if (parsed.data.y !== undefined) updateData.y = parsed.data.y
    if (parsed.data.rotation !== undefined) updateData.rotation = parsed.data.rotation
    if (parsed.data.width !== undefined) updateData.width = parsed.data.width
    if (parsed.data.depth !== undefined) updateData.depth = parsed.data.depth

    if (Object.keys(updateData).length === 0) {
      return c.json(failedResponse(c, { message: "No fields to update" }), 400)
    }

    const [updated] = await db
      .update(furniture)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(furniture.id, furnitureId))
      .returning()

    if (!updated) {
      return c.json(failedResponse(c, { message: "Furniture not found" }), 404)
    }

    return c.json(successResponse(c, { data: updated, message: "Furniture updated" }))
  } catch (error) {
    console.error("Error updating furniture:", error)
    return c.json(failedResponse(c, { message: "Failed to update furniture" }), 500)
  }
}
