import { Context } from "hono"
import { db } from "../../../config/db"
import { windows, walls } from "../../../schema"
import { eq } from "drizzle-orm"
import { CreateWindowSchemaV2 } from "../../../types/blueprint-v2"
import { successResponse, failedResponse, formatZodErrors } from "../../../utils/response/helpers"

/**
 * POST /api/v2/windows
 * Create a new window on a wall
 */
export async function createWindowHandler(c: Context) {
  try {
    const body = await c.req.json()
    const parsed = CreateWindowSchemaV2.safeParse(body)

    if (!parsed.success) {
      return c.json(failedResponse(c, { message: "Invalid window data", error: formatZodErrors(parsed.error) }), 400)
    }

    // Verify wall exists
    const [wall] = await db
      .select()
      .from(walls)
      .where(eq(walls.id, parsed.data.wallId))
      .limit(1)

    if (!wall) {
      return c.json(failedResponse(c, { message: "Wall not found" }), 404)
    }

    // Create window
    const [window] = await db
      .insert(windows)
      .values({
        wallId: parsed.data.wallId,
        position: parsed.data.position,
        type: parsed.data.type,
        width: parsed.data.width,
        height: parsed.data.height,
        sillHeight: parsed.data.sillHeight,
      })
      .returning()

    return c.json(successResponse(c, { data: window, message: "Window created" }), 201)
  } catch (error) {
    console.error("Error creating window:", error)
    return c.json(failedResponse(c, { message: "Failed to create window" }), 500)
  }
}
