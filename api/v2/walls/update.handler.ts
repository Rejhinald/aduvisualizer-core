import { Context } from "hono"
import { db } from "../../../config/db"
import { walls } from "../../../schema"
import { eq } from "drizzle-orm"
import { UpdateWallSchema } from "../../../types/blueprint-v2"
import { successResponse, failedResponse, formatZodErrors } from "../../../utils/response/helpers"

/**
 * PATCH /api/v2/walls/:wallId
 * Update a wall's properties (thickness, height)
 */
export async function updateWallHandler(c: Context) {
  try {
    const wallId = c.req.param("wallId")
    if (!wallId) {
      return c.json(failedResponse(c, { message: "Wall ID is required" }), 400)
    }

    const body = await c.req.json()
    const parsed = UpdateWallSchema.safeParse(body)

    if (!parsed.success) {
      return c.json(failedResponse(c, { message: "Invalid wall data", error: formatZodErrors(parsed.error) }), 400)
    }

    const updateData: Record<string, number | string> = {}
    if (parsed.data.thickness !== undefined) updateData.thickness = parsed.data.thickness
    if (parsed.data.height !== undefined) updateData.height = parsed.data.height
    if (parsed.data.wallType !== undefined) updateData.wallType = parsed.data.wallType

    if (Object.keys(updateData).length === 0) {
      return c.json(failedResponse(c, { message: "No fields to update" }), 400)
    }

    const [updated] = await db
      .update(walls)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(walls.id, wallId))
      .returning()

    if (!updated) {
      return c.json(failedResponse(c, { message: "Wall not found" }), 404)
    }

    return c.json(successResponse(c, { data: updated, message: "Wall updated" }))
  } catch (error) {
    console.error("Error updating wall:", error)
    return c.json(failedResponse(c, { message: "Failed to update wall" }), 500)
  }
}
