import type { Context } from "hono"
import { db } from "../../../config/db"
import { finishes } from "../../../schema"
import { successResponse, failedResponse, formatZodErrors } from "../../../utils/response/helpers"
import { UpdateFinishSchema } from "../../../types/finish"
import { eq, and } from "drizzle-orm"
import { sql } from "drizzle-orm"

export async function updateFinishHandler(c: Context) {
  try {
    const finishId = c.req.param("finishId")

    if (!finishId) {
      return c.json(
        failedResponse(c, {
          message: "Finish ID is required",
        }),
        400
      )
    }

    const body = await c.req.json()
    const parsed = UpdateFinishSchema.safeParse(body)

    if (!parsed.success) {
      return c.json(
        failedResponse(c, {
          message: "Validation failed",
          error: formatZodErrors(parsed.error),
        }),
        400
      )
    }

    // Check if finish exists
    const [existingFinish] = await db
      .select({ id: finishes.id })
      .from(finishes)
      .where(and(eq(finishes.id, finishId), eq(finishes.isDeleted, false)))
      .limit(1)

    if (!existingFinish) {
      return c.json(
        failedResponse(c, {
          message: "Finishes not found",
        }),
        404
      )
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: sql`now()`,
    }

    if (parsed.data.globalTemplate !== undefined) {
      updateData.globalTemplate = parsed.data.globalTemplate
    }
    if (parsed.data.globalTier !== undefined) {
      updateData.globalTier = parsed.data.globalTier
    }
    if (parsed.data.roomFinishes !== undefined) {
      updateData.roomFinishes = parsed.data.roomFinishes
    }
    if (parsed.data.cameraPlacement !== undefined) {
      updateData.cameraPlacement = parsed.data.cameraPlacement
    }

    const [finish] = await db
      .update(finishes)
      .set(updateData)
      .where(eq(finishes.id, finishId))
      .returning()

    return c.json(
      successResponse(c, {
        data: { finish },
        message: "Finishes updated successfully",
      }),
      200
    )
  } catch (e) {
    console.error("Update finishes error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to update finishes",
        error: { message: String(e) },
      }),
      500
    )
  }
}
