import type { Context } from "hono"
import { db } from "../../../config/db"
import { projects } from "../../../schema"
import { eq, and } from "drizzle-orm"
import { successResponse, failedResponse, formatZodErrors } from "../../../utils/response/helpers"
import { z } from "zod"

/**
 * Set the geo-location for a project
 * This anchors the blueprint to a real-world location for satellite overlay
 */
const SetGeoLocationSchema = z.object({
  // Latitude of the lot center
  lat: z.number().min(-90).max(90),
  // Longitude of the lot center
  lng: z.number().min(-180).max(180),
  // Rotation in degrees (0 = north up, 90 = east up)
  rotation: z.number().min(0).max(360).optional().default(0),
  // Optional address info
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  // Lot dimensions (if known)
  lotWidthFeet: z.number().positive().optional(),
  lotDepthFeet: z.number().positive().optional(),
})

export async function setGeoLocationHandler(c: Context) {
  try {
    const id = c.req.param("id")
    const body = await c.req.json()
    const parsed = SetGeoLocationSchema.safeParse(body)

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
        geoLat: parsed.data.lat,
        geoLng: parsed.data.lng,
        geoRotation: parsed.data.rotation,
        address: parsed.data.address,
        city: parsed.data.city,
        state: parsed.data.state,
        zipCode: parsed.data.zipCode,
        lotWidthFeet: parsed.data.lotWidthFeet,
        lotDepthFeet: parsed.data.lotDepthFeet,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning()

    return c.json(
      successResponse(c, {
        data: {
          projectId: updated.id,
          geoLocation: {
            lat: updated.geoLat,
            lng: updated.geoLng,
            rotation: updated.geoRotation,
          },
          address: {
            address: updated.address,
            city: updated.city,
            state: updated.state,
            zipCode: updated.zipCode,
          },
          lotDimensions: {
            widthFeet: updated.lotWidthFeet,
            depthFeet: updated.lotDepthFeet,
          },
        },
        message: "Geo-location set successfully. Blueprint is now anchored to this location.",
      })
    )
  } catch (e) {
    console.error("Set geo-location error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to set geo-location",
        error: { message: String(e) },
      }),
      500
    )
  }
}
