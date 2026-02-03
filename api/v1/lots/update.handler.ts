import type { Context } from "hono"
import { db } from "../../../config/db"
import { lots } from "../../../schema"
import { successResponse, failedResponse, formatZodErrors } from "../../../utils/response/helpers"
import { UpdateLotSchema } from "../../../types/lot"
import { eq, and } from "drizzle-orm"

export async function updateLotHandler(c: Context) {
  try {
    const lotId = c.req.param("lotId")

    if (!lotId) {
      return c.json(
        failedResponse(c, {
          message: "Lot ID is required",
        }),
        400
      )
    }

    const body = await c.req.json()
    const parsed = UpdateLotSchema.safeParse(body)

    if (!parsed.success) {
      return c.json(
        failedResponse(c, {
          message: "Validation failed",
          error: formatZodErrors(parsed.error),
        }),
        400
      )
    }

    // Check if lot exists
    const [existingLot] = await db
      .select({ id: lots.id })
      .from(lots)
      .where(and(eq(lots.id, lotId), eq(lots.isDeleted, false)))
      .limit(1)

    if (!existingLot) {
      return c.json(
        failedResponse(c, {
          message: "Lot not found",
        }),
        404
      )
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    if (parsed.data.parcelNumber !== undefined) updateData.parcelNumber = parsed.data.parcelNumber
    if (parsed.data.address !== undefined) updateData.address = parsed.data.address
    if (parsed.data.city !== undefined) updateData.city = parsed.data.city
    if (parsed.data.state !== undefined) updateData.state = parsed.data.state
    if (parsed.data.zipCode !== undefined) updateData.zipCode = parsed.data.zipCode
    if (parsed.data.geoLat !== undefined) updateData.geoLat = parsed.data.geoLat
    if (parsed.data.geoLng !== undefined) updateData.geoLng = parsed.data.geoLng
    if (parsed.data.geoRotation !== undefined) updateData.geoRotation = parsed.data.geoRotation
    if (parsed.data.boundaryVertices !== undefined) updateData.boundaryVertices = parsed.data.boundaryVertices
    if (parsed.data.lotWidthFeet !== undefined) updateData.lotWidthFeet = parsed.data.lotWidthFeet
    if (parsed.data.lotDepthFeet !== undefined) updateData.lotDepthFeet = parsed.data.lotDepthFeet
    if (parsed.data.lotAreaSqFt !== undefined) updateData.lotAreaSqFt = parsed.data.lotAreaSqFt
    if (parsed.data.aduOffsetX !== undefined) updateData.aduOffsetX = parsed.data.aduOffsetX
    if (parsed.data.aduOffsetY !== undefined) updateData.aduOffsetY = parsed.data.aduOffsetY
    if (parsed.data.aduRotation !== undefined) updateData.aduRotation = parsed.data.aduRotation
    if (parsed.data.setbackFrontFeet !== undefined) updateData.setbackFrontFeet = parsed.data.setbackFrontFeet
    if (parsed.data.setbackBackFeet !== undefined) updateData.setbackBackFeet = parsed.data.setbackBackFeet
    if (parsed.data.setbackLeftFeet !== undefined) updateData.setbackLeftFeet = parsed.data.setbackLeftFeet
    if (parsed.data.setbackRightFeet !== undefined) updateData.setbackRightFeet = parsed.data.setbackRightFeet
    if (parsed.data.dataSource !== undefined) updateData.dataSource = parsed.data.dataSource

    const [lot] = await db
      .update(lots)
      .set(updateData)
      .where(eq(lots.id, lotId))
      .returning()

    return c.json(
      successResponse(c, {
        data: { lot },
        message: "Lot updated successfully",
      }),
      200
    )
  } catch (e) {
    console.error("Update lot error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to update lot",
        error: { message: String(e) },
      }),
      500
    )
  }
}
