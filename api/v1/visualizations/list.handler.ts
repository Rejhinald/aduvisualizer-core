import type { Context } from "hono"
import { db } from "../../../config/db"
import { visualizations } from "../../../schema"
import { eq, and, desc } from "drizzle-orm"
import { successListResponse, failedResponse } from "../../../utils/response/helpers"

export async function listVisualizationsHandler(c: Context) {
  try {
    const blueprintId = c.req.param("blueprintId")

    const items = await db
      .select()
      .from(visualizations)
      .where(and(eq(visualizations.blueprintId, blueprintId), eq(visualizations.isDeleted, false)))
      .orderBy(desc(visualizations.createdAt))

    return c.json(
      successListResponse(c, {
        data: items,
        message: "Visualizations retrieved successfully",
        pagination: {
          total: items.length,
          limit: items.length,
          page: 1,
          pages: 1,
          prev: false,
          next: false,
        },
      })
    )
  } catch (e) {
    console.error("List visualizations error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to list visualizations",
        error: { message: String(e) },
      }),
      500
    )
  }
}
