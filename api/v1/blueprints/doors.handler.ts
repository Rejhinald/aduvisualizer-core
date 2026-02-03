import type { Context } from "hono"
import { db } from "../../../config/db"
import { doors, blueprints } from "../../../schema"
import { eq, and } from "drizzle-orm"
import { successResponse, failedResponse, formatZodErrors } from "../../../utils/response/helpers"
import { z } from "zod"

// Door type enum
const DoorTypeEnum = z.enum([
  "single", "double", "sliding", "french", "opening"
])

// Schema for creating a door
const CreateDoorSchema = z.object({
  type: DoorTypeEnum,
  x: z.number(),
  y: z.number(),
  widthFeet: z.number().positive(),
  heightFeet: z.number().positive().optional(),
  rotation: z.number().optional().default(0),
  isExterior: z.boolean().optional().default(false),
  connectsRoomId1: z.string().uuid().optional(),
  connectsRoomId2: z.string().uuid().optional(),
})

// Schema for updating a door
const UpdateDoorSchema = CreateDoorSchema.partial()

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
export async function createDoorHandler(c: Context) {
  try {
    const blueprintId = c.req.param("blueprintId")
    const body = await c.req.json()
    const parsed = CreateDoorSchema.safeParse(body)

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
    const [door] = await db
      .insert(doors)
      .values({
        blueprintId,
        type: data.type,
        x: data.x,
        y: data.y,
        widthFeet: data.widthFeet,
        heightFeet: data.heightFeet,
        rotation: data.rotation,
        isExterior: data.isExterior,
        connectsRoomId1: data.connectsRoomId1,
        connectsRoomId2: data.connectsRoomId2,
      })
      .returning()

    return c.json(
      successResponse(c, {
        data: { door },
        message: "Door created successfully",
      }),
      201
    )
  } catch (e) {
    console.error("Create door error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to create door",
        error: { message: String(e) },
      }),
      500
    )
  }
}

// LIST
export async function listDoorsHandler(c: Context) {
  try {
    const blueprintId = c.req.param("blueprintId")

    const doorsList = await db
      .select()
      .from(doors)
      .where(and(eq(doors.blueprintId, blueprintId), eq(doors.isDeleted, false)))

    return c.json(
      successResponse(c, {
        data: { doors: doorsList, count: doorsList.length },
        message: `Found ${doorsList.length} door(s)`,
      }),
      200
    )
  } catch (e) {
    console.error("List doors error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to list doors",
        error: { message: String(e) },
      }),
      500
    )
  }
}

// GET
export async function getDoorHandler(c: Context) {
  try {
    const doorId = c.req.param("doorId")

    const [door] = await db
      .select()
      .from(doors)
      .where(and(eq(doors.id, doorId), eq(doors.isDeleted, false)))
      .limit(1)

    if (!door) {
      return c.json(
        failedResponse(c, { message: "Door not found" }),
        404
      )
    }

    return c.json(
      successResponse(c, {
        data: { door },
        message: "Door retrieved successfully",
      }),
      200
    )
  } catch (e) {
    console.error("Get door error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to get door",
        error: { message: String(e) },
      }),
      500
    )
  }
}

// UPDATE
export async function updateDoorHandler(c: Context) {
  try {
    const doorId = c.req.param("doorId")
    const body = await c.req.json()
    const parsed = UpdateDoorSchema.safeParse(body)

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
    const [door] = await db
      .update(doors)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(doors.id, doorId), eq(doors.isDeleted, false)))
      .returning()

    if (!door) {
      return c.json(
        failedResponse(c, { message: "Door not found" }),
        404
      )
    }

    return c.json(
      successResponse(c, {
        data: { door },
        message: "Door updated successfully",
      }),
      200
    )
  } catch (e) {
    console.error("Update door error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to update door",
        error: { message: String(e) },
      }),
      500
    )
  }
}

// DELETE
export async function deleteDoorHandler(c: Context) {
  try {
    const doorId = c.req.param("doorId")

    const [deleted] = await db
      .update(doors)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(and(eq(doors.id, doorId), eq(doors.isDeleted, false)))
      .returning({ id: doors.id })

    if (!deleted) {
      return c.json(
        failedResponse(c, { message: "Door not found" }),
        404
      )
    }

    return c.json(
      successResponse(c, {
        data: { id: deleted.id },
        message: "Door deleted successfully",
      }),
      200
    )
  } catch (e) {
    console.error("Delete door error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to delete door",
        error: { message: String(e) },
      }),
      500
    )
  }
}
