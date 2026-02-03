import type { Context } from "hono"
import { db } from "../../../config/db"
import { rooms, blueprints } from "../../../schema"
import { eq, and } from "drizzle-orm"
import { successResponse, failedResponse, formatZodErrors } from "../../../utils/response/helpers"
import { z } from "zod"

// Room type enum
const RoomTypeEnum = z.enum([
  "bedroom", "bathroom", "kitchen", "living", "dining", "corridor", "other"
])

// Vertex schema
const VertexSchema = z.object({
  x: z.number(),
  y: z.number(),
})

// Schema for creating a room
const CreateRoomSchema = z.object({
  name: z.string().min(1).max(100),
  type: RoomTypeEnum,
  description: z.string().optional(),
  color: z.string().optional(),
  vertices: z.array(VertexSchema).min(3),
  areaSqFt: z.number().positive(),
  widthFeet: z.number().positive().optional(),
  heightFeet: z.number().positive().optional(),
  rotation: z.number().optional().default(0),
})

// Schema for updating a room
const UpdateRoomSchema = CreateRoomSchema.partial()

// Verify blueprint exists
async function verifyBlueprint(blueprintId: string) {
  const [blueprint] = await db
    .select({ id: blueprints.id })
    .from(blueprints)
    .where(and(eq(blueprints.id, blueprintId), eq(blueprints.isDeleted, false)))
    .limit(1)
  return blueprint
}

// CREATE - Add a room to a blueprint
export async function createRoomHandler(c: Context) {
  try {
    const blueprintId = c.req.param("blueprintId")
    const body = await c.req.json()
    const parsed = CreateRoomSchema.safeParse(body)

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
    const [room] = await db
      .insert(rooms)
      .values({
        blueprintId,
        name: data.name,
        type: data.type,
        description: data.description,
        color: data.color,
        vertices: data.vertices,
        areaSqFt: data.areaSqFt,
        widthFeet: data.widthFeet,
        heightFeet: data.heightFeet,
        rotation: data.rotation,
      })
      .returning()

    return c.json(
      successResponse(c, {
        data: { room },
        message: "Room created successfully",
      }),
      201
    )
  } catch (e) {
    console.error("Create room error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to create room",
        error: { message: String(e) },
      }),
      500
    )
  }
}

// LIST - Get all rooms for a blueprint
export async function listRoomsHandler(c: Context) {
  try {
    const blueprintId = c.req.param("blueprintId")

    const roomsList = await db
      .select()
      .from(rooms)
      .where(and(eq(rooms.blueprintId, blueprintId), eq(rooms.isDeleted, false)))

    return c.json(
      successResponse(c, {
        data: { rooms: roomsList, count: roomsList.length },
        message: `Found ${roomsList.length} room(s)`,
      }),
      200
    )
  } catch (e) {
    console.error("List rooms error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to list rooms",
        error: { message: String(e) },
      }),
      500
    )
  }
}

// GET - Get a single room
export async function getRoomHandler(c: Context) {
  try {
    const roomId = c.req.param("roomId")

    const [room] = await db
      .select()
      .from(rooms)
      .where(and(eq(rooms.id, roomId), eq(rooms.isDeleted, false)))
      .limit(1)

    if (!room) {
      return c.json(
        failedResponse(c, { message: "Room not found" }),
        404
      )
    }

    return c.json(
      successResponse(c, {
        data: { room },
        message: "Room retrieved successfully",
      }),
      200
    )
  } catch (e) {
    console.error("Get room error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to get room",
        error: { message: String(e) },
      }),
      500
    )
  }
}

// UPDATE - Update a room
export async function updateRoomHandler(c: Context) {
  try {
    const roomId = c.req.param("roomId")
    const body = await c.req.json()
    const parsed = UpdateRoomSchema.safeParse(body)

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
    const [room] = await db
      .update(rooms)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(rooms.id, roomId), eq(rooms.isDeleted, false)))
      .returning()

    if (!room) {
      return c.json(
        failedResponse(c, { message: "Room not found" }),
        404
      )
    }

    return c.json(
      successResponse(c, {
        data: { room },
        message: "Room updated successfully",
      }),
      200
    )
  } catch (e) {
    console.error("Update room error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to update room",
        error: { message: String(e) },
      }),
      500
    )
  }
}

// DELETE - Soft delete a room
export async function deleteRoomHandler(c: Context) {
  try {
    const roomId = c.req.param("roomId")

    const [deleted] = await db
      .update(rooms)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(and(eq(rooms.id, roomId), eq(rooms.isDeleted, false)))
      .returning({ id: rooms.id })

    if (!deleted) {
      return c.json(
        failedResponse(c, { message: "Room not found" }),
        404
      )
    }

    return c.json(
      successResponse(c, {
        data: { id: deleted.id },
        message: "Room deleted successfully",
      }),
      200
    )
  } catch (e) {
    console.error("Delete room error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to delete room",
        error: { message: String(e) },
      }),
      500
    )
  }
}
