import type { Context } from "hono"
import { db } from "../../../config/db"
import { lots } from "../../../schema"
import { successResponse, failedResponse } from "../../../utils/response/helpers"
import { eq, and } from "drizzle-orm"

export async function getLotHandler(c: Context) {
  try {
    const blueprintId = c.req.param("blueprintId")

    if (!blueprintId) {
      return c.json(
        failedResponse(c, {
          message: "Blueprint ID is required",
        }),
        400
      )
    }

    const [lot] = await db
      .select()
      .from(lots)
      .where(and(eq(lots.blueprintId, blueprintId), eq(lots.isDeleted, false)))
      .limit(1)

    // Return null if no lot found (not an error - blueprint may not have a lot yet)
    return c.json(
      successResponse(c, {
        data: { lot: lot || null },
        message: lot ? "Lot retrieved successfully" : "No lot found for this blueprint",
      }),
      200
    )
  } catch (e) {
    console.error("Get lot error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to get lot",
        error: { message: String(e) },
      }),
      500
    )
  }
}
