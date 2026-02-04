import type { Context } from "hono"
import { db } from "../../../config/db"
import { finishes } from "../../../schema"
import type { RoomFinish } from "../../../schema/finishes"
import { successResponse, failedResponse, formatZodErrors } from "../../../utils/response/helpers"
import { UpdateRoomFinishSchema } from "../../../types/finish"
import { eq, and } from "drizzle-orm"
import { sql } from "drizzle-orm"

export async function updateRoomFinishHandler(c: Context) {
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
    const parsed = UpdateRoomFinishSchema.safeParse(body)

    if (!parsed.success) {
      return c.json(
        failedResponse(c, {
          message: "Validation failed",
          error: formatZodErrors(parsed.error),
        }),
        400
      )
    }

    // Get existing finish
    const [existingFinish] = await db
      .select()
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

    // Find and update or add the room in roomFinishes array
    const roomFinishes = [...(existingFinish.roomFinishes || [])] as RoomFinish[]
    const roomIndex = roomFinishes.findIndex(r => r.roomId === parsed.data.roomId)

    let updatedRoom: RoomFinish

    if (roomIndex === -1) {
      // Add new room finish
      updatedRoom = {
        roomId: parsed.data.roomId,
        roomName: parsed.data.roomName || "Unknown",
        roomType: parsed.data.roomType || "other",
        vibe: parsed.data.vibe || "modern_minimal",
        tier: parsed.data.tier || existingFinish.globalTier || "standard",
        lifestyle: parsed.data.lifestyle || [],
        customNotes: parsed.data.customNotes,
      }
      roomFinishes.push(updatedRoom)
    } else {
      // Update existing room finish
      updatedRoom = { ...roomFinishes[roomIndex] }
      if (parsed.data.roomName !== undefined) updatedRoom.roomName = parsed.data.roomName
      if (parsed.data.roomType !== undefined) updatedRoom.roomType = parsed.data.roomType
      if (parsed.data.vibe !== undefined) updatedRoom.vibe = parsed.data.vibe
      if (parsed.data.tier !== undefined) updatedRoom.tier = parsed.data.tier
      if (parsed.data.lifestyle !== undefined) updatedRoom.lifestyle = parsed.data.lifestyle
      if (parsed.data.customNotes !== undefined) updatedRoom.customNotes = parsed.data.customNotes
      roomFinishes[roomIndex] = updatedRoom
    }

    const [finish] = await db
      .update(finishes)
      .set({
        roomFinishes,
        updatedAt: sql`now()`,
      })
      .where(eq(finishes.id, finishId))
      .returning()

    return c.json(
      successResponse(c, {
        data: { finish, updatedRoom },
        message: "Room finish updated successfully",
      }),
      200
    )
  } catch (e) {
    console.error("Update room finish error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to update room finish",
        error: { message: String(e) },
      }),
      500
    )
  }
}
