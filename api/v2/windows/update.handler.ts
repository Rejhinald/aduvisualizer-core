import { Context } from "hono"
import { db } from "../../../config/db"
import { windows } from "../../../schema"
import { eq } from "drizzle-orm"
import { UpdateWindowSchemaV2 } from "../../../types/blueprint-v2"
import { successResponse, failedResponse, formatZodErrors } from "../../../utils/response/helpers"

/**
 * PATCH /api/v2/windows/:windowId
 * Update a window's properties
 */
export async function updateWindowHandler(c: Context) {
  try {
    const windowId = c.req.param("windowId")
    if (!windowId) {
      return c.json(failedResponse(c, { message: "Window ID is required" }), 400)
    }

    const body = await c.req.json()
    const parsed = UpdateWindowSchemaV2.safeParse(body)

    if (!parsed.success) {
      return c.json(failedResponse(c, { message: "Invalid window data", error: formatZodErrors(parsed.error) }), 400)
    }

    const updateData: Record<string, number | string> = {}
    if (parsed.data.position !== undefined) updateData.position = parsed.data.position
    if (parsed.data.type !== undefined) updateData.type = parsed.data.type
    if (parsed.data.width !== undefined) updateData.width = parsed.data.width
    if (parsed.data.height !== undefined) updateData.height = parsed.data.height
    if (parsed.data.sillHeight !== undefined) updateData.sillHeight = parsed.data.sillHeight

    if (Object.keys(updateData).length === 0) {
      return c.json(failedResponse(c, { message: "No fields to update" }), 400)
    }

    const [updated] = await db
      .update(windows)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(windows.id, windowId))
      .returning()

    if (!updated) {
      return c.json(failedResponse(c, { message: "Window not found" }), 404)
    }

    return c.json(successResponse(c, { data: updated, message: "Window updated" }))
  } catch (error) {
    console.error("Error updating window:", error)
    return c.json(failedResponse(c, { message: "Failed to update window" }), 500)
  }
}
