import { Context } from "hono"
import { z } from "zod"
import { db } from "../../../config/db"
import { lots } from "../../../schema"
import { eq } from "drizzle-orm"
import { PointSchema, SetbacksSchema, LotSourceEnum } from "../../../types/blueprint-v2"
import { successResponse, failedResponse, formatZodErrors } from "../../../utils/response/helpers"

// Update lot schema
const UpdateLotSchemaV2 = z.object({
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  geoLat: z.number().optional(),
  geoLng: z.number().optional(),
  boundary: z.array(PointSchema).optional(),
  setbacks: SetbacksSchema.optional(),
  source: LotSourceEnum.optional(),
})

/**
 * PATCH /api/v2/lots/:lotId
 * Update a lot
 */
export async function updateLotHandler(c: Context) {
  try {
    const lotId = c.req.param("lotId")
    if (!lotId) {
      return c.json(failedResponse(c, { message: "Lot ID is required" }), 400)
    }

    const body = await c.req.json()
    const parsed = UpdateLotSchemaV2.safeParse(body)

    if (!parsed.success) {
      return c.json(failedResponse(c, { message: "Invalid lot data", error: formatZodErrors(parsed.error) }), 400)
    }

    const updateData: Record<string, unknown> = {}
    if (parsed.data.address !== undefined) updateData.address = parsed.data.address
    if (parsed.data.city !== undefined) updateData.city = parsed.data.city
    if (parsed.data.state !== undefined) updateData.state = parsed.data.state
    if (parsed.data.zipCode !== undefined) updateData.zipCode = parsed.data.zipCode
    if (parsed.data.geoLat !== undefined) updateData.geoLat = parsed.data.geoLat
    if (parsed.data.geoLng !== undefined) updateData.geoLng = parsed.data.geoLng
    if (parsed.data.boundary !== undefined) updateData.boundary = parsed.data.boundary
    if (parsed.data.setbacks !== undefined) updateData.setbacks = parsed.data.setbacks
    if (parsed.data.source !== undefined) updateData.source = parsed.data.source

    if (Object.keys(updateData).length === 0) {
      return c.json(failedResponse(c, { message: "No fields to update" }), 400)
    }

    const [updated] = await db
      .update(lots)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(lots.id, lotId))
      .returning()

    if (!updated) {
      return c.json(failedResponse(c, { message: "Lot not found" }), 404)
    }

    return c.json(successResponse(c, { data: updated, message: "Lot updated" }))
  } catch (error) {
    console.error("Error updating lot:", error)
    return c.json(failedResponse(c, { message: "Failed to update lot" }), 500)
  }
}
