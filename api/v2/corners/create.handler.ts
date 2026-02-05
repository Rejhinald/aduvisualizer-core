import { Context } from "hono"
import { db } from "../../../config/db"
import { corners } from "../../../schema"
import { CreateCornerSchema } from "../../../types/blueprint-v2"
import { successResponse, failedResponse, formatZodErrors } from "../../../utils/response/helpers"

/**
 * POST /api/v2/blueprints/:blueprintId/corners
 * Create a new corner for a blueprint
 */
export async function createCornerHandler(c: Context) {
  try {
    const blueprintId = c.req.param("blueprintId")
    if (!blueprintId) {
      return c.json(failedResponse(c, { message: "Blueprint ID is required" }), 400)
    }

    const body = await c.req.json()
    const parsed = CreateCornerSchema.safeParse(body)

    if (!parsed.success) {
      return c.json(failedResponse(c, { message: "Invalid corner data", error: formatZodErrors(parsed.error) }), 400)
    }

    const { x, y, elevation } = parsed.data

    const [corner] = await db
      .insert(corners)
      .values({
        blueprintId,
        x,
        y,
        elevation: elevation ?? 0,
      })
      .returning()

    return c.json(successResponse(c, { data: corner, message: "Corner created" }), 201)
  } catch (error) {
    console.error("Error creating corner:", error)
    return c.json(failedResponse(c, { message: "Failed to create corner" }), 500)
  }
}
