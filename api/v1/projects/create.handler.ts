import type { Context } from "hono"
import { db } from "../../../config/db"
import { projects } from "../../../schema"
import { successResponse, failedResponse, formatZodErrors } from "../../../utils/response/helpers"
import { z } from "zod"

const CreateProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
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
})

export async function createProjectHandler(c: Context) {
  try {
    const body = await c.req.json()
    const parsed = CreateProjectSchema.safeParse(body)

    if (!parsed.success) {
      return c.json(
        failedResponse(c, {
          message: "Validation failed",
          error: formatZodErrors(parsed.error),
        }),
        400
      )
    }

    const [project] = await db
      .insert(projects)
      .values({
        name: parsed.data.name,
        description: parsed.data.description,
        address: parsed.data.address,
        city: parsed.data.city,
        state: parsed.data.state,
        zipCode: parsed.data.zipCode,
        country: parsed.data.country ?? "USA",
        geoLat: parsed.data.geoLat,
        geoLng: parsed.data.geoLng,
        geoRotation: parsed.data.geoRotation ?? 0,
        lotWidthFeet: parsed.data.lotWidthFeet,
        lotDepthFeet: parsed.data.lotDepthFeet,
        status: "draft",
      })
      .returning()

    return c.json(
      successResponse(c, {
        data: project,
        message: "Project created successfully",
      }),
      201
    )
  } catch (e) {
    console.error("Create project error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to create project",
        error: { message: String(e) },
      }),
      500
    )
  }
}
