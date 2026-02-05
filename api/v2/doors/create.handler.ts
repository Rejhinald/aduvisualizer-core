import { Context } from "hono"
import { db } from "../../../config/db"
import { doors, walls } from "../../../schema"
import { eq } from "drizzle-orm"
import { CreateDoorSchemaV2 } from "../../../types/blueprint-v2"
import { successResponse, failedResponse, formatZodErrors } from "../../../utils/response/helpers"

/**
 * POST /api/v2/doors
 * Create a new door on a wall
 */
export async function createDoorHandler(c: Context) {
  try {
    const body = await c.req.json()
    const parsed = CreateDoorSchemaV2.safeParse(body)

    if (!parsed.success) {
      return c.json(failedResponse(c, { message: "Invalid door data", error: formatZodErrors(parsed.error) }), 400)
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

    // Create door
    const [door] = await db
      .insert(doors)
      .values({
        wallId: parsed.data.wallId,
        position: parsed.data.position,
        type: parsed.data.type,
        width: parsed.data.width,
        height: parsed.data.height,
      })
      .returning()

    return c.json(successResponse(c, { data: door, message: "Door created" }), 201)
  } catch (error) {
    console.error("Error creating door:", error)
    return c.json(failedResponse(c, { message: "Failed to create door" }), 500)
  }
}
