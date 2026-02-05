import { Context } from "hono"
import { db } from "../../../config/db"
import { doors } from "../../../schema"
import { eq } from "drizzle-orm"
import { UpdateDoorSchemaV2 } from "../../../types/blueprint-v2"
import { successResponse, failedResponse, formatZodErrors } from "../../../utils/response/helpers"

/**
 * PATCH /api/v2/doors/:doorId
 * Update a door's properties
 */
export async function updateDoorHandler(c: Context) {
  try {
    const doorId = c.req.param("doorId")
    if (!doorId) {
      return c.json(failedResponse(c, { message: "Door ID is required" }), 400)
    }

    const body = await c.req.json()
    const parsed = UpdateDoorSchemaV2.safeParse(body)

    if (!parsed.success) {
      return c.json(failedResponse(c, { message: "Invalid door data", error: formatZodErrors(parsed.error) }), 400)
    }

    const updateData: Record<string, number | string> = {}
    if (parsed.data.position !== undefined) updateData.position = parsed.data.position
    if (parsed.data.type !== undefined) updateData.type = parsed.data.type
    if (parsed.data.width !== undefined) updateData.width = parsed.data.width
    if (parsed.data.height !== undefined) updateData.height = parsed.data.height

    if (Object.keys(updateData).length === 0) {
      return c.json(failedResponse(c, { message: "No fields to update" }), 400)
    }

    const [updated] = await db
      .update(doors)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(doors.id, doorId))
      .returning()

    if (!updated) {
      return c.json(failedResponse(c, { message: "Door not found" }), 404)
    }

    return c.json(successResponse(c, { data: updated, message: "Door updated" }))
  } catch (error) {
    console.error("Error updating door:", error)
    return c.json(failedResponse(c, { message: "Failed to update door" }), 500)
  }
}
