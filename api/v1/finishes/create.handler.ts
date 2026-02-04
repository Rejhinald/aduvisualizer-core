import type { Context } from "hono"
import { db } from "../../../config/db"
import { finishes, blueprints } from "../../../schema"
import { successResponse, failedResponse, formatZodErrors } from "../../../utils/response/helpers"
import { CreateFinishSchema } from "../../../types/finish"
import { eq, and } from "drizzle-orm"

export async function createFinishHandler(c: Context) {
  try {
    const body = await c.req.json()
    const parsed = CreateFinishSchema.safeParse(body)

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

    // Check if finishes already exist for this blueprint
    const [existingFinish] = await db
      .select({ id: finishes.id })
      .from(finishes)
      .where(and(eq(finishes.blueprintId, parsed.data.blueprintId), eq(finishes.isDeleted, false)))
      .limit(1)

    if (existingFinish) {
      return c.json(
        failedResponse(c, {
          message: "Finishes already exist for this blueprint. Use PUT to update.",
        }),
        409
      )
    }

    const [finish] = await db
      .insert(finishes)
      .values({
        blueprintId: parsed.data.blueprintId,
        globalTemplate: parsed.data.globalTemplate,
        globalTier: parsed.data.globalTier,
        roomFinishes: parsed.data.roomFinishes,
        cameraPlacement: parsed.data.cameraPlacement ?? null,
      })
      .returning()

    return c.json(
      successResponse(c, {
        data: { finish },
        message: "Finishes created successfully",
      }),
      201
    )
  } catch (e) {
    console.error("Create finishes error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to create finishes",
        error: { message: String(e) },
      }),
      500
    )
  }
}
