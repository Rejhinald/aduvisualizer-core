import type { Context } from "hono"
import { db } from "../../../config/db"
import { finishes, blueprints } from "../../../schema"
import { successResponse, failedResponse } from "../../../utils/response/helpers"
import { eq, and } from "drizzle-orm"

export async function getFinishHandler(c: Context) {
  try {
    const blueprintId = c.req.param("blueprintId")

    if (!blueprintId) {
      return c.json(
        failedResponse(c, {
          message: "Blueprint ID is required",
        }),
        400
      )
    }

    // Verify blueprint exists
    const [blueprint] = await db
      .select({ id: blueprints.id })
      .from(blueprints)
      .where(and(eq(blueprints.id, blueprintId), eq(blueprints.isDeleted, false)))
      .limit(1)

    if (!blueprint) {
      return c.json(
        failedResponse(c, {
          message: "Blueprint not found",
        }),
        404
      )
    }

    // Get finishes
    const [finish] = await db
      .select()
      .from(finishes)
      .where(and(eq(finishes.blueprintId, blueprintId), eq(finishes.isDeleted, false)))
      .limit(1)

    if (!finish) {
      return c.json(
        successResponse(c, {
          data: { finish: null },
          message: "No finishes found for this blueprint",
        }),
        200
      )
    }

    return c.json(
      successResponse(c, {
        data: { finish },
        message: "Finishes retrieved successfully",
      }),
      200
    )
  } catch (e) {
    console.error("Get finishes error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to get finishes",
        error: { message: String(e) },
      }),
      500
    )
  }
}
