import { Context } from "hono"
import { z } from "zod"
import { db } from "../../../config/db"
import { lots, blueprints } from "../../../schema"
import { eq } from "drizzle-orm"
import { LotSchemaV2, SetbacksSchema } from "../../../types/blueprint-v2"
import { successResponse, failedResponse, formatZodErrors } from "../../../utils/response/helpers"

// Create lot schema (extended with blueprintId)
const CreateLotSchemaV2 = LotSchemaV2.omit({ id: true }).extend({
  blueprintId: z.string().uuid(),
})

/**
 * POST /api/v2/lots
 * Create a lot for a blueprint
 */
export async function createLotHandler(c: Context) {
  try {
    const body = await c.req.json()
    const parsed = CreateLotSchemaV2.safeParse(body)

    if (!parsed.success) {
      return c.json(failedResponse(c, { message: "Invalid lot data", error: formatZodErrors(parsed.error) }), 400)
    }

    // Verify blueprint exists
    const [blueprint] = await db
      .select()
      .from(blueprints)
      .where(eq(blueprints.id, parsed.data.blueprintId))
      .limit(1)

    if (!blueprint) {
      return c.json(failedResponse(c, { message: "Blueprint not found" }), 404)
    }

    // Check if lot already exists for this blueprint
    const [existingLot] = await db
      .select()
      .from(lots)
      .where(eq(lots.blueprintId, parsed.data.blueprintId))
      .limit(1)

    if (existingLot) {
      return c.json(failedResponse(c, { message: "Lot already exists for this blueprint. Use PATCH to update." }), 409)
    }

    // Create lot
    const [lot] = await db
      .insert(lots)
      .values({
        blueprintId: parsed.data.blueprintId,
        address: parsed.data.address,
        city: parsed.data.city,
        state: parsed.data.state,
        zipCode: parsed.data.zipCode,
        geoLat: parsed.data.geoLat,
        geoLng: parsed.data.geoLng,
        boundary: parsed.data.boundary,
        setbacks: parsed.data.setbacks,
        source: parsed.data.source,
      })
      .returning()

    return c.json(successResponse(c, { data: lot, message: "Lot created" }), 201)
  } catch (error) {
    console.error("Error creating lot:", error)
    return c.json(failedResponse(c, { message: "Failed to create lot" }), 500)
  }
}
