import { Context } from "hono"
import { z } from "zod"
import { db } from "../../../config/db"
import { furniture, blueprints } from "../../../schema"
import { eq } from "drizzle-orm"
import { CreateFurnitureSchemaV2 } from "../../../types/blueprint-v2"
import { successResponse, failedResponse, formatZodErrors } from "../../../utils/response/helpers"

// Extend schema to require blueprintId
const CreateFurnitureWithBlueprintSchema = CreateFurnitureSchemaV2.extend({
  blueprintId: z.string().uuid(),
})

/**
 * POST /api/v2/furniture
 * Create furniture in a blueprint
 */
export async function createFurnitureHandler(c: Context) {
  try {
    const body = await c.req.json()
    const parsed = CreateFurnitureWithBlueprintSchema.safeParse(body)

    if (!parsed.success) {
      return c.json(failedResponse(c, { message: "Invalid furniture data", error: formatZodErrors(parsed.error) }), 400)
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

    // Create furniture
    const [item] = await db
      .insert(furniture)
      .values({
        blueprintId: parsed.data.blueprintId,
        type: parsed.data.type,
        x: parsed.data.x,
        y: parsed.data.y,
        rotation: parsed.data.rotation,
        width: parsed.data.width,
        depth: parsed.data.depth,
      })
      .returning()

    return c.json(successResponse(c, { data: item, message: "Furniture created" }), 201)
  } catch (error) {
    console.error("Error creating furniture:", error)
    return c.json(failedResponse(c, { message: "Failed to create furniture" }), 500)
  }
}
