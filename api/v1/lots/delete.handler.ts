import type { Context } from "hono"
import { db } from "../../../config/db"
import { lots } from "../../../schema"
import { successResponse, failedResponse } from "../../../utils/response/helpers"
import { eq, and } from "drizzle-orm"

export async function deleteLotHandler(c: Context) {
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

    // Soft delete
    await db
      .update(lots)
      .set({
        isDeleted: true,
        updatedAt: new Date(),
      })
      .where(eq(lots.id, lotId))

    return c.json(
      successResponse(c, {
        data: { id: lotId },
        message: "Lot deleted successfully",
      }),
      200
    )
  } catch (e) {
    console.error("Delete lot error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to delete lot",
        error: { message: String(e) },
      }),
      500
    )
  }
}
