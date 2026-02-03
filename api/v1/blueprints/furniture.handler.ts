import type { Context } from "hono"
import { db } from "../../../config/db"
import { furniture, blueprints, FURNITURE_TYPES, FURNITURE_CATEGORIES } from "../../../schema"
import { eq, and } from "drizzle-orm"
import { successResponse, failedResponse, formatZodErrors } from "../../../utils/response/helpers"
import { z } from "zod"

// Furniture type enum from schema
const FurnitureTypeEnum = z.enum(FURNITURE_TYPES as unknown as [string, ...string[]])

// Furniture category enum from schema
const FurnitureCategoryEnum = z.enum(FURNITURE_CATEGORIES as unknown as [string, ...string[]])

// Schema for creating furniture
const CreateFurnitureSchema = z.object({
  type: FurnitureTypeEnum,
  category: FurnitureCategoryEnum,
  name: z.string().max(100).optional(),
  x: z.number(),
  y: z.number(),
  widthFeet: z.number().positive(),
  heightFeet: z.number().positive(),
  actualHeightFeet: z.number().positive().optional(),
  rotation: z.number().optional().default(0),
  roomId: z.string().uuid().optional(),
  zIndex: z.number().int().optional().default(5),
})

// Schema for updating furniture
const UpdateFurnitureSchema = CreateFurnitureSchema.partial()

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
export async function createFurnitureHandler(c: Context) {
  try {
    const blueprintId = c.req.param("blueprintId")
    const body = await c.req.json()
    const parsed = CreateFurnitureSchema.safeParse(body)

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
    const [item] = await db
      .insert(furniture)
      .values({
        blueprintId,
        type: data.type,
        category: data.category,
        name: data.name,
        x: data.x,
        y: data.y,
        widthFeet: data.widthFeet,
        heightFeet: data.heightFeet,
        actualHeightFeet: data.actualHeightFeet,
        rotation: data.rotation,
        roomId: data.roomId,
        zIndex: data.zIndex,
      })
      .returning()

    return c.json(
      successResponse(c, {
        data: { furniture: item },
        message: "Furniture created successfully",
      }),
      201
    )
  } catch (e) {
    console.error("Create furniture error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to create furniture",
        error: { message: String(e) },
      }),
      500
    )
  }
}

// LIST
export async function listFurnitureHandler(c: Context) {
  try {
    const blueprintId = c.req.param("blueprintId")
    const category = c.req.query("category")

    let query = db
      .select()
      .from(furniture)
      .where(and(eq(furniture.blueprintId, blueprintId), eq(furniture.isDeleted, false)))

    const furnitureList = await query

    // Filter by category if provided
    const filteredList = category
      ? furnitureList.filter((f) => f.category === category)
      : furnitureList

    return c.json(
      successResponse(c, {
        data: { furniture: filteredList, count: filteredList.length },
        message: `Found ${filteredList.length} furniture item(s)`,
      }),
      200
    )
  } catch (e) {
    console.error("List furniture error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to list furniture",
        error: { message: String(e) },
      }),
      500
    )
  }
}

// GET
export async function getFurnitureHandler(c: Context) {
  try {
    const furnitureId = c.req.param("furnitureId")

    const [item] = await db
      .select()
      .from(furniture)
      .where(and(eq(furniture.id, furnitureId), eq(furniture.isDeleted, false)))
      .limit(1)

    if (!item) {
      return c.json(
        failedResponse(c, { message: "Furniture not found" }),
        404
      )
    }

    return c.json(
      successResponse(c, {
        data: { furniture: item },
        message: "Furniture retrieved successfully",
      }),
      200
    )
  } catch (e) {
    console.error("Get furniture error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to get furniture",
        error: { message: String(e) },
      }),
      500
    )
  }
}

// UPDATE
export async function updateFurnitureHandler(c: Context) {
  try {
    const furnitureId = c.req.param("furnitureId")
    const body = await c.req.json()
    const parsed = UpdateFurnitureSchema.safeParse(body)

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
    const [item] = await db
      .update(furniture)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(furniture.id, furnitureId), eq(furniture.isDeleted, false)))
      .returning()

    if (!item) {
      return c.json(
        failedResponse(c, { message: "Furniture not found" }),
        404
      )
    }

    return c.json(
      successResponse(c, {
        data: { furniture: item },
        message: "Furniture updated successfully",
      }),
      200
    )
  } catch (e) {
    console.error("Update furniture error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to update furniture",
        error: { message: String(e) },
      }),
      500
    )
  }
}

// DELETE
export async function deleteFurnitureHandler(c: Context) {
  try {
    const furnitureId = c.req.param("furnitureId")

    const [deleted] = await db
      .update(furniture)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(and(eq(furniture.id, furnitureId), eq(furniture.isDeleted, false)))
      .returning({ id: furniture.id })

    if (!deleted) {
      return c.json(
        failedResponse(c, { message: "Furniture not found" }),
        404
      )
    }

    return c.json(
      successResponse(c, {
        data: { id: deleted.id },
        message: "Furniture deleted successfully",
      }),
      200
    )
  } catch (e) {
    console.error("Delete furniture error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to delete furniture",
        error: { message: String(e) },
      }),
      500
    )
  }
}

// BULK CREATE - Create multiple furniture items at once
export async function bulkCreateFurnitureHandler(c: Context) {
  try {
    const blueprintId = c.req.param("blueprintId")
    const body = await c.req.json()

    const BulkCreateSchema = z.object({
      items: z.array(CreateFurnitureSchema).min(1).max(100),
    })

    const parsed = BulkCreateSchema.safeParse(body)

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

    const items = parsed.data.items.map((item) => ({
      blueprintId,
      type: item.type,
      category: item.category,
      name: item.name,
      x: item.x,
      y: item.y,
      widthFeet: item.widthFeet,
      heightFeet: item.heightFeet,
      actualHeightFeet: item.actualHeightFeet,
      rotation: item.rotation ?? 0,
      roomId: item.roomId,
      zIndex: item.zIndex ?? 5,
    }))

    const created = await db
      .insert(furniture)
      .values(items)
      .returning()

    return c.json(
      successResponse(c, {
        data: { furniture: created, count: created.length },
        message: `Created ${created.length} furniture item(s) successfully`,
      }),
      201
    )
  } catch (e) {
    console.error("Bulk create furniture error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to create furniture items",
        error: { message: String(e) },
      }),
      500
    )
  }
}
