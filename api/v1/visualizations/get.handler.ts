import type { Context } from "hono"
import { db } from "../../../config/db"
import { visualizations } from "../../../schema"
import { eq, and } from "drizzle-orm"
import { successResponse, failedResponse } from "../../../utils/response/helpers"

export async function getVisualizationHandler(c: Context) {
  try {
    const id = c.req.param("id")

    const [visualization] = await db
      .select()
      .from(visualizations)
      .where(and(eq(visualizations.id, id), eq(visualizations.isDeleted, false)))
      .limit(1)

    if (!visualization) {
      return c.json(
        failedResponse(c, { message: "Visualization not found" }),
        404
      )
    }

    return c.json(
      successResponse(c, {
        data: visualization,
        message: "Visualization retrieved successfully",
      })
    )
  } catch (e) {
    console.error("Get visualization error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to get visualization",
        error: { message: String(e) },
      }),
      500
    )
  }
}
