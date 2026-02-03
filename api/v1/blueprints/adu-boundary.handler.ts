import type { Context } from "hono"
import { db } from "../../../config/db"
import { blueprints } from "../../../schema"
import { eq, and } from "drizzle-orm"
import { successResponse, failedResponse, formatZodErrors } from "../../../utils/response/helpers"
import { z } from "zod"

// Vertex schema for boundary points
const VertexSchema = z.object({
  x: z.number(),
  y: z.number(),
})

// Schema for updating ADU boundary
const UpdateADUBoundarySchema = z.object({
  aduBoundary: z.array(VertexSchema).min(3).max(50),
  aduAreaSqFt: z.number().positive().optional(),
})

// Helper to calculate area from vertices (shoelace formula)
function calculatePolygonArea(vertices: Array<{ x: number; y: number }>, pixelsPerFoot: number): number {
  if (vertices.length < 3) return 0

  let area = 0
  const n = vertices.length

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += vertices[i].x * vertices[j].y
    area -= vertices[j].x * vertices[i].y
  }

  area = Math.abs(area) / 2

  // Convert from pixels squared to feet squared
  const areaInFeet = area / (pixelsPerFoot * pixelsPerFoot)
  return Math.round(areaInFeet * 100) / 100 // Round to 2 decimal places
}

// GET ADU Boundary
export async function getADUBoundaryHandler(c: Context) {
  try {
    const blueprintId = c.req.param("blueprintId")

    const [blueprint] = await db
      .select({
        id: blueprints.id,
        aduBoundary: blueprints.aduBoundary,
        aduAreaSqFt: blueprints.aduAreaSqFt,
        pixelsPerFoot: blueprints.pixelsPerFoot,
        canvasWidth: blueprints.canvasWidth,
        canvasHeight: blueprints.canvasHeight,
      })
      .from(blueprints)
      .where(and(eq(blueprints.id, blueprintId), eq(blueprints.isDeleted, false)))
      .limit(1)

    if (!blueprint) {
      return c.json(
        failedResponse(c, { message: "Blueprint not found" }),
        404
      )
    }

    return c.json(
      successResponse(c, {
        data: {
          blueprintId: blueprint.id,
          aduBoundary: blueprint.aduBoundary || [],
          aduAreaSqFt: blueprint.aduAreaSqFt,
          pixelsPerFoot: blueprint.pixelsPerFoot,
          canvasWidth: blueprint.canvasWidth,
          canvasHeight: blueprint.canvasHeight,
        },
        message: "ADU boundary retrieved successfully",
      }),
      200
    )
  } catch (e) {
    console.error("Get ADU boundary error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to get ADU boundary",
        error: { message: String(e) },
      }),
      500
    )
  }
}

// UPDATE ADU Boundary
export async function updateADUBoundaryHandler(c: Context) {
  try {
    const blueprintId = c.req.param("blueprintId")
    const body = await c.req.json()
    const parsed = UpdateADUBoundarySchema.safeParse(body)

    if (!parsed.success) {
      return c.json(
        failedResponse(c, {
          message: "Validation failed",
          error: formatZodErrors(parsed.error),
        }),
        400
      )
    }

    // First get the blueprint to get pixelsPerFoot for area calculation
    const [existingBlueprint] = await db
      .select({ pixelsPerFoot: blueprints.pixelsPerFoot })
      .from(blueprints)
      .where(and(eq(blueprints.id, blueprintId), eq(blueprints.isDeleted, false)))
      .limit(1)

    if (!existingBlueprint) {
      return c.json(
        failedResponse(c, { message: "Blueprint not found" }),
        404
      )
    }

    const data = parsed.data
    const pixelsPerFoot = existingBlueprint.pixelsPerFoot || 100

    // Calculate area if not provided
    const aduAreaSqFt = data.aduAreaSqFt ?? calculatePolygonArea(data.aduBoundary, pixelsPerFoot)

    const [updated] = await db
      .update(blueprints)
      .set({
        aduBoundary: data.aduBoundary,
        aduAreaSqFt,
        updatedAt: new Date(),
      })
      .where(and(eq(blueprints.id, blueprintId), eq(blueprints.isDeleted, false)))
      .returning({
        id: blueprints.id,
        aduBoundary: blueprints.aduBoundary,
        aduAreaSqFt: blueprints.aduAreaSqFt,
      })

    if (!updated) {
      return c.json(
        failedResponse(c, { message: "Blueprint not found" }),
        404
      )
    }

    return c.json(
      successResponse(c, {
        data: {
          blueprintId: updated.id,
          aduBoundary: updated.aduBoundary,
          aduAreaSqFt: updated.aduAreaSqFt,
        },
        message: "ADU boundary updated successfully",
      }),
      200
    )
  } catch (e) {
    console.error("Update ADU boundary error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to update ADU boundary",
        error: { message: String(e) },
      }),
      500
    )
  }
}

// RESET ADU Boundary to default
export async function resetADUBoundaryHandler(c: Context) {
  try {
    const blueprintId = c.req.param("blueprintId")

    // Get blueprint canvas config
    const [existingBlueprint] = await db
      .select({
        canvasWidth: blueprints.canvasWidth,
        canvasHeight: blueprints.canvasHeight,
        pixelsPerFoot: blueprints.pixelsPerFoot,
        maxCanvasFeet: blueprints.maxCanvasFeet,
      })
      .from(blueprints)
      .where(and(eq(blueprints.id, blueprintId), eq(blueprints.isDeleted, false)))
      .limit(1)

    if (!existingBlueprint) {
      return c.json(
        failedResponse(c, { message: "Blueprint not found" }),
        404
      )
    }

    const canvasWidth = existingBlueprint.canvasWidth || 800
    const canvasHeight = existingBlueprint.canvasHeight || 800
    const pixelsPerFoot = existingBlueprint.pixelsPerFoot || 100

    // Default boundary: centered rectangle, 20x24 feet
    const defaultWidthFeet = 20
    const defaultHeightFeet = 24
    const defaultWidthPx = defaultWidthFeet * pixelsPerFoot
    const defaultHeightPx = defaultHeightFeet * pixelsPerFoot

    const centerX = canvasWidth / 2
    const centerY = canvasHeight / 2
    const halfWidth = defaultWidthPx / 2
    const halfHeight = defaultHeightPx / 2

    const defaultBoundary = [
      { x: centerX - halfWidth, y: centerY - halfHeight },
      { x: centerX + halfWidth, y: centerY - halfHeight },
      { x: centerX + halfWidth, y: centerY + halfHeight },
      { x: centerX - halfWidth, y: centerY + halfHeight },
    ]

    const defaultAreaSqFt = defaultWidthFeet * defaultHeightFeet

    const [updated] = await db
      .update(blueprints)
      .set({
        aduBoundary: defaultBoundary,
        aduAreaSqFt: defaultAreaSqFt,
        updatedAt: new Date(),
      })
      .where(and(eq(blueprints.id, blueprintId), eq(blueprints.isDeleted, false)))
      .returning({
        id: blueprints.id,
        aduBoundary: blueprints.aduBoundary,
        aduAreaSqFt: blueprints.aduAreaSqFt,
      })

    if (!updated) {
      return c.json(
        failedResponse(c, { message: "Blueprint not found" }),
        404
      )
    }

    return c.json(
      successResponse(c, {
        data: {
          blueprintId: updated.id,
          aduBoundary: updated.aduBoundary,
          aduAreaSqFt: updated.aduAreaSqFt,
        },
        message: "ADU boundary reset to default successfully",
      }),
      200
    )
  } catch (e) {
    console.error("Reset ADU boundary error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to reset ADU boundary",
        error: { message: String(e) },
      }),
      500
    )
  }
}

// VALIDATE ADU Boundary - Check if rooms fit within boundary
export async function validateADUBoundaryHandler(c: Context) {
  try {
    const blueprintId = c.req.param("blueprintId")

    // Get blueprint with boundary
    const [blueprint] = await db
      .select()
      .from(blueprints)
      .where(and(eq(blueprints.id, blueprintId), eq(blueprints.isDeleted, false)))
      .limit(1)

    if (!blueprint) {
      return c.json(
        failedResponse(c, { message: "Blueprint not found" }),
        404
      )
    }

    const validationErrors: string[] = []
    let isValid = true

    // Check if boundary exists
    if (!blueprint.aduBoundary || blueprint.aduBoundary.length < 3) {
      validationErrors.push("ADU boundary must have at least 3 points")
      isValid = false
    }

    // Check if area is reasonable (between 100 and 1500 sq ft for ADU)
    if (blueprint.aduAreaSqFt) {
      if (blueprint.aduAreaSqFt < 100) {
        validationErrors.push("ADU area is too small (minimum 100 sq ft)")
        isValid = false
      }
      if (blueprint.aduAreaSqFt > 1500) {
        validationErrors.push("ADU area exceeds typical maximum (1500 sq ft)")
        // This is a warning, not an error
      }
    }

    // Update validation status
    await db
      .update(blueprints)
      .set({
        isValid,
        validationErrors: validationErrors.length > 0 ? validationErrors : null,
        updatedAt: new Date(),
      })
      .where(eq(blueprints.id, blueprintId))

    return c.json(
      successResponse(c, {
        data: {
          blueprintId,
          isValid,
          validationErrors,
          aduAreaSqFt: blueprint.aduAreaSqFt,
        },
        message: isValid ? "ADU boundary is valid" : "ADU boundary has validation issues",
      }),
      200
    )
  } catch (e) {
    console.error("Validate ADU boundary error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to validate ADU boundary",
        error: { message: String(e) },
      }),
      500
    )
  }
}
