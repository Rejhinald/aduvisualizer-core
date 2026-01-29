import type { Context } from "hono"
import { db } from "../../../config/db"
import { blueprints, rooms, doors, windows, furniture } from "../../../schema"
import { eq, and } from "drizzle-orm"
import { successResponse, failedResponse } from "../../../utils/response/helpers"

export async function getBlueprintHandler(c: Context) {
  try {
    const id = c.req.param("id")

    // Get blueprint
    const [blueprint] = await db
      .select()
      .from(blueprints)
      .where(and(eq(blueprints.id, id), eq(blueprints.isDeleted, false)))
      .limit(1)

    if (!blueprint) {
      return c.json(
        failedResponse(c, { message: "Blueprint not found" }),
        404
      )
    }

    // Get all related data
    const [roomsData, doorsData, windowsData, furnitureData] = await Promise.all([
      db.select().from(rooms).where(and(eq(rooms.blueprintId, id), eq(rooms.isDeleted, false))),
      db.select().from(doors).where(and(eq(doors.blueprintId, id), eq(doors.isDeleted, false))),
      db.select().from(windows).where(and(eq(windows.blueprintId, id), eq(windows.isDeleted, false))),
      db.select().from(furniture).where(and(eq(furniture.blueprintId, id), eq(furniture.isDeleted, false))),
    ])

    return c.json(
      successResponse(c, {
        data: {
          blueprint,
          rooms: roomsData,
          doors: doorsData,
          windows: windowsData,
          furniture: furnitureData,
        },
        message: "Blueprint retrieved successfully",
      })
    )
  } catch (e) {
    console.error("Get blueprint error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to get blueprint",
        error: { message: String(e) },
      }),
      500
    )
  }
}
