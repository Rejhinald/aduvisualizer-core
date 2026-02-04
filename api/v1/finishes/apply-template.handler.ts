import type { Context } from "hono"
import { db } from "../../../config/db"
import { finishes, rooms } from "../../../schema"
import type { RoomFinish, VibeOption, TierOption } from "../../../schema/finishes"
import { successResponse, failedResponse, formatZodErrors } from "../../../utils/response/helpers"
import { TemplateEnum, TEMPLATE_DEFINITIONS } from "../../../types/finish"
import { eq, and } from "drizzle-orm"
import { sql } from "drizzle-orm"
import { z } from "zod"

const ApplyTemplateSchema = z.object({
  template: TemplateEnum,
  // overwriteExisting: if true, replace all vibes; if false, only fill empty ones
  overwriteExisting: z.boolean().default(false),
})

export async function applyTemplateHandler(c: Context) {
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
    const parsed = ApplyTemplateSchema.safeParse(body)

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

    const template = TEMPLATE_DEFINITIONS[parsed.data.template]
    const existingRoomFinishes = [...(existingFinish.roomFinishes || [])] as RoomFinish[]

    // Fetch all rooms from the blueprint to ensure we have entries for all of them
    const blueprintRooms = await db
      .select()
      .from(rooms)
      .where(and(eq(rooms.blueprintId, existingFinish.blueprintId), eq(rooms.isDeleted, false)))

    // Build a map of existing room finishes by roomId
    const existingFinishMap = new Map<string, RoomFinish>()
    for (const rf of existingRoomFinishes) {
      existingFinishMap.set(rf.roomId, rf)
    }

    // Apply template to all rooms
    const appliedTo: string[] = []
    const updatedRoomFinishes: RoomFinish[] = []

    for (const room of blueprintRooms) {
      const existingFinish = existingFinishMap.get(room.id)

      if (existingFinish) {
        // Room already has a finish entry
        if (!parsed.data.overwriteExisting && existingFinish.vibe) {
          // Don't overwrite - room already has a vibe set
          updatedRoomFinishes.push(existingFinish)
        } else {
          // Apply template vibe
          appliedTo.push(room.id)
          updatedRoomFinishes.push({
            ...existingFinish,
            vibe: template.defaultVibe as VibeOption,
            tier: template.defaultTier as TierOption,
          })
        }
      } else {
        // Room doesn't have a finish entry yet - create one with template defaults
        appliedTo.push(room.id)
        updatedRoomFinishes.push({
          roomId: room.id,
          roomName: room.name,
          roomType: room.type,
          vibe: template.defaultVibe as VibeOption,
          tier: template.defaultTier as TierOption,
          lifestyle: [],
        })
      }
    }

    const [finish] = await db
      .update(finishes)
      .set({
        globalTemplate: parsed.data.template,
        globalTier: template.defaultTier,
        roomFinishes: updatedRoomFinishes,
        updatedAt: sql`now()`,
      })
      .where(eq(finishes.id, finishId))
      .returning()

    return c.json(
      successResponse(c, {
        data: {
          finish,
          appliedTo,
        },
        message: `Template "${template.label}" applied to ${appliedTo.length} room(s)`,
      }),
      200
    )
  } catch (e) {
    console.error("Apply template error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to apply template",
        error: { message: String(e) },
      }),
      500
    )
  }
}
