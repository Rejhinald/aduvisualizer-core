import { Context } from "hono"
import { db } from "../../../config/db"
import { corners } from "../../../schema"
import { eq } from "drizzle-orm"
import { UpdateCornerSchema } from "../../../types/blueprint-v2"
import { successResponse, failedResponse, formatZodErrors } from "../../../utils/response/helpers"

/**
 * PATCH /api/v2/corners/:cornerId
 * Update a corner's position
 */
export async function updateCornerHandler(c: Context) {
  try {
    const cornerId = c.req.param("cornerId")
    if (!cornerId) {
      return c.json(failedResponse(c, { message: "Corner ID is required" }), 400)
    }

    const body = await c.req.json()
    const parsed = UpdateCornerSchema.safeParse(body)

    if (!parsed.success) {
      return c.json(failedResponse(c, { message: "Invalid corner data", error: formatZodErrors(parsed.error) }), 400)
    }

    const updateData: Record<string, number> = {}
    if (parsed.data.x !== undefined) updateData.x = parsed.data.x
    if (parsed.data.y !== undefined) updateData.y = parsed.data.y
    if (parsed.data.elevation !== undefined) updateData.elevation = parsed.data.elevation

    if (Object.keys(updateData).length === 0) {
      return c.json(failedResponse(c, { message: "No fields to update" }), 400)
    }

    const [updated] = await db
      .update(corners)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(corners.id, cornerId))
      .returning()

    if (!updated) {
      return c.json(failedResponse(c, { message: "Corner not found" }), 404)
    }

    return c.json(successResponse(c, { data: updated, message: "Corner updated" }))
  } catch (error) {
    console.error("Error updating corner:", error)
    return c.json(failedResponse(c, { message: "Failed to update corner" }), 500)
  }
}
