import type { Context } from "hono"
import { db } from "../../../config/db"
import { blueprints } from "../../../schema"
import { eq, and, desc } from "drizzle-orm"
import { successListResponse, failedResponse } from "../../../utils/response/helpers"

export async function listBlueprintsHandler(c: Context) {
  try {
    const projectId = c.req.param("projectId")

    const items = await db
      .select()
      .from(blueprints)
      .where(and(eq(blueprints.projectId, projectId), eq(blueprints.isDeleted, false)))
      .orderBy(desc(blueprints.version))

    return c.json(
      successListResponse(c, {
        data: items,
        message: "Blueprints retrieved successfully",
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
    console.error("List blueprints error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to list blueprints",
        error: { message: String(e) },
      }),
      500
    )
  }
}
