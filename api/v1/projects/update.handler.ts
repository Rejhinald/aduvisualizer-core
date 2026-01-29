import type { Context } from "hono"
import { db } from "../../../config/db"
import { projects } from "../../../schema"
import { eq, and } from "drizzle-orm"
import { successResponse, failedResponse, formatZodErrors } from "../../../utils/response/helpers"
import { z } from "zod"

const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  geoLat: z.number().min(-90).max(90).optional(),
  geoLng: z.number().min(-180).max(180).optional(),
  geoRotation: z.number().min(0).max(360).optional(),
  lotWidthFeet: z.number().positive().optional(),
  lotDepthFeet: z.number().positive().optional(),
  status: z.enum(["draft", "in_progress", "completed", "archived"]).optional(),
})

export async function updateProjectHandler(c: Context) {
  try {
    const id = c.req.param("id")
    const body = await c.req.json()
    const parsed = UpdateProjectSchema.safeParse(body)

    if (!parsed.success) {
      return c.json(
        failedResponse(c, {
          message: "Validation failed",
          error: formatZodErrors(parsed.error),
        }),
        400
      )
    }

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

    const [updated] = await db
      .update(projects)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning()

    return c.json(
      successResponse(c, {
        data: updated,
        message: "Project updated successfully",
      })
    )
  } catch (e) {
    console.error("Update project error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to update project",
        error: { message: String(e) },
      }),
      500
    )
  }
}
