import type { Context } from "hono"
import { db } from "../../../config/db"
import { windows, blueprints } from "../../../schema"
import { eq, and } from "drizzle-orm"
import { successResponse, failedResponse, formatZodErrors } from "../../../utils/response/helpers"
import { z } from "zod"

// Window type enum
const WindowTypeEnum = z.enum([
  "standard", "bay", "picture", "sliding"
])

// Schema for creating a window
const CreateWindowSchema = z.object({
  type: WindowTypeEnum,
  x: z.number(),
  y: z.number(),
  widthFeet: z.number().positive(),
  heightFeet: z.number().positive(),
  sillHeightFeet: z.number().positive().optional(),
  rotation: z.number().optional().default(0),
  roomId: z.string().uuid().optional(),
})

// Schema for updating a window
const UpdateWindowSchema = CreateWindowSchema.partial()

// Verify blueprint exists
async function verifyBlueprint(blueprintId: string) {
  const [blueprint] = await db
    .select({ id: blueprints.id })
    .from(blueprints)
    .where(and(eq(blueprints.id, blueprintId), eq(blueprints.isDeleted, false)))
    .limit(1)
  return blueprint
}

// CREATE
export async function createWindowHandler(c: Context) {
  try {
    const blueprintId = c.req.param("blueprintId")
    const body = await c.req.json()
    const parsed = CreateWindowSchema.safeParse(body)

    if (!parsed.success) {
      return c.json(
        failedResponse(c, {
          message: "Validation failed",
          error: formatZodErrors(parsed.error),
        }),
        400
      )
    }

    const blueprint = await verifyBlueprint(blueprintId)
    if (!blueprint) {
      return c.json(
        failedResponse(c, { message: "Blueprint not found" }),
        404
      )
    }

    const data = parsed.data
    const [window] = await db
      .insert(windows)
      .values({
        blueprintId,
        type: data.type,
        x: data.x,
        y: data.y,
        widthFeet: data.widthFeet,
        heightFeet: data.heightFeet,
        sillHeightFeet: data.sillHeightFeet,
        rotation: data.rotation,
        roomId: data.roomId,
      })
      .returning()

    return c.json(
      successResponse(c, {
        data: { window },
        message: "Window created successfully",
      }),
      201
    )
  } catch (e) {
    console.error("Create window error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to create window",
        error: { message: String(e) },
      }),
      500
    )
  }
}

// LIST
export async function listWindowsHandler(c: Context) {
  try {
    const blueprintId = c.req.param("blueprintId")

    const windowsList = await db
      .select()
      .from(windows)
      .where(and(eq(windows.blueprintId, blueprintId), eq(windows.isDeleted, false)))

    return c.json(
      successResponse(c, {
        data: { windows: windowsList, count: windowsList.length },
        message: `Found ${windowsList.length} window(s)`,
      }),
      200
    )
  } catch (e) {
    console.error("List windows error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to list windows",
        error: { message: String(e) },
      }),
      500
    )
  }
}

// GET
export async function getWindowHandler(c: Context) {
  try {
    const windowId = c.req.param("windowId")

    const [window] = await db
      .select()
      .from(windows)
      .where(and(eq(windows.id, windowId), eq(windows.isDeleted, false)))
      .limit(1)

    if (!window) {
      return c.json(
        failedResponse(c, { message: "Window not found" }),
        404
      )
    }

    return c.json(
      successResponse(c, {
        data: { window },
        message: "Window retrieved successfully",
      }),
      200
    )
  } catch (e) {
    console.error("Get window error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to get window",
        error: { message: String(e) },
      }),
      500
    )
  }
}

// UPDATE
export async function updateWindowHandler(c: Context) {
  try {
    const windowId = c.req.param("windowId")
    const body = await c.req.json()
    const parsed = UpdateWindowSchema.safeParse(body)

    if (!parsed.success) {
      return c.json(
        failedResponse(c, {
          message: "Validation failed",
          error: formatZodErrors(parsed.error),
        }),
        400
      )
    }

    const data = parsed.data
    const [window] = await db
      .update(windows)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(windows.id, windowId), eq(windows.isDeleted, false)))
      .returning()

    if (!window) {
      return c.json(
        failedResponse(c, { message: "Window not found" }),
        404
      )
    }

    return c.json(
      successResponse(c, {
        data: { window },
        message: "Window updated successfully",
      }),
      200
    )
  } catch (e) {
    console.error("Update window error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to update window",
        error: { message: String(e) },
      }),
      500
    )
  }
}

// DELETE
export async function deleteWindowHandler(c: Context) {
  try {
    const windowId = c.req.param("windowId")

    const [deleted] = await db
      .update(windows)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(and(eq(windows.id, windowId), eq(windows.isDeleted, false)))
      .returning({ id: windows.id })

    if (!deleted) {
      return c.json(
        failedResponse(c, { message: "Window not found" }),
        404
      )
    }

    return c.json(
      successResponse(c, {
        data: { id: deleted.id },
        message: "Window deleted successfully",
      }),
      200
    )
  } catch (e) {
    console.error("Delete window error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to delete window",
        error: { message: String(e) },
      }),
      500
    )
  }
}
