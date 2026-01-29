import type { Context } from "hono"
import { db } from "../../../config/db"
import { projects } from "../../../schema"
import { eq, and } from "drizzle-orm"
import { successResponse, failedResponse } from "../../../utils/response/helpers"

export async function deleteProjectHandler(c: Context) {
  try {
    const id = c.req.param("id")

    // Check if project exists
    const [existing] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.isDeleted, false)))
      .limit(1)

    if (!existing) {
      return c.json(
        failedResponse(c, { message: "Project not found" }),
        404
      )
    }

    // Soft delete
    await db
      .update(projects)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))

    return c.json(
      successResponse(c, {
        message: "Project deleted successfully",
      })
    )
  } catch (e) {
    console.error("Delete project error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to delete project",
        error: { message: String(e) },
      }),
      500
    )
  }
}
