import type { Context } from "hono"
import { db } from "../../../config/db"
import { lots, blueprints } from "../../../schema"
import { successResponse, failedResponse, formatZodErrors } from "../../../utils/response/helpers"
import { CreateLotSchema } from "../../../types/lot"
import { eq, and } from "drizzle-orm"

export async function createLotHandler(c: Context) {
  try {
    const body = await c.req.json()
    const parsed = CreateLotSchema.safeParse(body)

    if (!parsed.success) {
      return c.json(
        failedResponse(c, {
          message: "Validation failed",
          error: formatZodErrors(parsed.error),
        }),
        400
      )
    }

    // Verify blueprint exists
    const [blueprint] = await db
      .select({ id: blueprints.id })
      .from(blueprints)
      .where(and(eq(blueprints.id, parsed.data.blueprintId), eq(blueprints.isDeleted, false)))
      .limit(1)

    if (!blueprint) {
      return c.json(
        failedResponse(c, {
          message: "Blueprint not found",
        }),
        404
      )
    }

    // Check if lot already exists for this blueprint (soft-delete aware)
    const [existingLot] = await db
      .select({ id: lots.id })
      .from(lots)
      .where(and(eq(lots.blueprintId, parsed.data.blueprintId), eq(lots.isDeleted, false)))
      .limit(1)

    if (existingLot) {
      return c.json(
        failedResponse(c, {
          message: "Lot already exists for this blueprint. Use PUT to update.",
        }),
        409
      )
    }

    const [lot] = await db
      .insert(lots)
      .values({
        blueprintId: parsed.data.blueprintId,
        parcelNumber: parsed.data.parcelNumber,
        address: parsed.data.address,
        city: parsed.data.city,
        state: parsed.data.state,
        zipCode: parsed.data.zipCode,
        geoLat: parsed.data.geoLat,
        geoLng: parsed.data.geoLng,
        geoRotation: parsed.data.geoRotation,
        boundaryVertices: parsed.data.boundaryVertices,
        lotWidthFeet: parsed.data.lotWidthFeet,
        lotDepthFeet: parsed.data.lotDepthFeet,
        lotAreaSqFt: parsed.data.lotAreaSqFt,
        aduOffsetX: parsed.data.aduOffsetX,
        aduOffsetY: parsed.data.aduOffsetY,
        aduRotation: parsed.data.aduRotation,
        setbackFrontFeet: parsed.data.setbackFrontFeet,
        setbackBackFeet: parsed.data.setbackBackFeet,
        setbackLeftFeet: parsed.data.setbackLeftFeet,
        setbackRightFeet: parsed.data.setbackRightFeet,
        dataSource: parsed.data.dataSource,
      })
      .returning()

    return c.json(
      successResponse(c, {
        data: { lot },
        message: "Lot created successfully",
      }),
      201
    )
  } catch (e) {
    console.error("Create lot error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to create lot",
        error: { message: String(e) },
      }),
      500
    )
  }
}
