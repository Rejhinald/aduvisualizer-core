import { Context } from "hono"
import { db } from "../../../config/db"
import { walls, corners } from "../../../schema"
import { eq, and, or } from "drizzle-orm"
import { CreateWallSchema } from "../../../types/blueprint-v2"
import { successResponse, failedResponse, formatZodErrors } from "../../../utils/response/helpers"

/**
 * POST /api/v2/blueprints/:blueprintId/walls
 * Create a new wall between two corners
 */
export async function createWallHandler(c: Context) {
  try {
    const blueprintId = c.req.param("blueprintId")
    if (!blueprintId) {
      return c.json(failedResponse(c, { message: "Blueprint ID is required" }), 400)
    }

    const body = await c.req.json()
    const parsed = CreateWallSchema.safeParse(body)

    if (!parsed.success) {
      return c.json(failedResponse(c, { message: "Invalid wall data", error: formatZodErrors(parsed.error) }), 400)
    }

    const { startCornerId, endCornerId, thickness, height, wallType } = parsed.data

    // Validate corners exist and belong to this blueprint
    const cornerCheck = await db
      .select({ id: corners.id })
      .from(corners)
      .where(
        and(
          eq(corners.blueprintId, blueprintId),
          or(
            eq(corners.id, startCornerId),
            eq(corners.id, endCornerId)
          )
        )
      )

    if (cornerCheck.length !== 2) {
      return c.json(failedResponse(c, { message: "One or both corners not found in this blueprint" }), 404)
    }

    // Check for existing wall between these corners
    const existingWall = await db
      .select({ id: walls.id })
      .from(walls)
      .where(
        and(
          eq(walls.blueprintId, blueprintId),
          or(
            and(
              eq(walls.startCornerId, startCornerId),
              eq(walls.endCornerId, endCornerId)
            ),
            and(
              eq(walls.startCornerId, endCornerId),
              eq(walls.endCornerId, startCornerId)
            )
          )
        )
      )
      .limit(1)

    if (existingWall.length > 0) {
      return c.json(failedResponse(c, { message: "Wall already exists between these corners" }), 409)
    }

    const [wall] = await db
      .insert(walls)
      .values({
        blueprintId,
        startCornerId,
        endCornerId,
        thickness: thickness ?? 0.5,
        height: height ?? 9,
        wallType: wallType ?? "solid",
      })
      .returning()

    return c.json(successResponse(c, { data: wall, message: "Wall created" }), 201)
  } catch (error) {
    console.error("Error creating wall:", error)
    return c.json(failedResponse(c, { message: "Failed to create wall" }), 500)
  }
}
