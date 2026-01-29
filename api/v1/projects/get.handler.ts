import type { Context } from "hono"
import { db } from "../../../config/db"
import { projects } from "../../../schema"
import { eq, and } from "drizzle-orm"
import { successResponse, failedResponse } from "../../../utils/response/helpers"

export async function getProjectHandler(c: Context) {
  try {
    const id = c.req.param("id")

    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.isDeleted, false)))
      .limit(1)

    if (!project) {
      return c.json(
        failedResponse(c, { message: "Project not found" }),
        404
      )
    }

    return c.json(
      successResponse(c, {
        data: project,
        message: "Project retrieved successfully",
      })
    )
  } catch (e) {
    console.error("Get project error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to get project",
        error: { message: String(e) },
      }),
      500
    )
  }
}
