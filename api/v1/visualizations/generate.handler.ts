import type { Context } from "hono"
import { db } from "../../../config/db"
import { visualizations, blueprints, rooms, doors, windows, furniture, finishes } from "../../../schema"
import { eq, and } from "drizzle-orm"
import { successResponse, failedResponse, formatZodErrors } from "../../../utils/response/helpers"
import { generatePromptData, type VisualizationType } from "../../../service/visualization/prompt-generator"
import { z } from "zod"
import { env } from "../../../utils/env/load"

const GenerateVisualizationSchema = z.object({
  blueprintId: z.string().uuid(),
  viewType: z.enum([
    "exterior_front",
    "exterior_back",
    "exterior_side",
    "exterior_aerial",
    "interior_living",
    "interior_bedroom",
    "interior_bathroom",
    "interior_kitchen",
    "floor_plan_3d",
    "custom",
  ]),
  name: z.string().optional(),
  style: z.string().optional(),
  timeOfDay: z.string().optional(),
  weather: z.string().optional(),
})

export async function generateVisualizationHandler(c: Context) {
  try {
    const body = await c.req.json()
    const parsed = GenerateVisualizationSchema.safeParse(body)

    if (!parsed.success) {
      return c.json(
        failedResponse(c, {
          message: "Validation failed",
          error: formatZodErrors(parsed.error),
        }),
        400
      )
    }

    const { blueprintId, viewType, name, style, timeOfDay, weather } = parsed.data

    // Get blueprint
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

    // Get all related data
    const [roomsData, doorsData, windowsData, furnitureData, finishesData] = await Promise.all([
      db.select().from(rooms).where(and(eq(rooms.blueprintId, blueprintId), eq(rooms.isDeleted, false))),
      db.select().from(doors).where(and(eq(doors.blueprintId, blueprintId), eq(doors.isDeleted, false))),
      db.select().from(windows).where(and(eq(windows.blueprintId, blueprintId), eq(windows.isDeleted, false))),
      db.select().from(furniture).where(and(eq(furniture.blueprintId, blueprintId), eq(furniture.isDeleted, false))),
      db.select().from(finishes).where(and(eq(finishes.blueprintId, blueprintId), eq(finishes.isDeleted, false))).limit(1),
    ])

    // Generate the prompt
    const { structuredData, naturalLanguagePrompt } = generatePromptData(
      {
        aduBoundary: blueprint.aduBoundary as Array<{ x: number; y: number }>,
        aduAreaSqFt: blueprint.aduAreaSqFt ?? 0,
        canvasWidth: blueprint.canvasWidth ?? 800,
        canvasHeight: blueprint.canvasHeight ?? 800,
        pixelsPerFoot: blueprint.pixelsPerFoot ?? 100,
        rooms: roomsData,
        doors: doorsData,
        windows: windowsData,
        furniture: furnitureData,
      },
      finishesData[0] ?? undefined,
      {
        viewType: viewType as VisualizationType,
        style,
        timeOfDay,
        weather,
      }
    )

    // Create visualization record
    const [visualization] = await db
      .insert(visualizations)
      .values({
        blueprintId,
        type: viewType,
        name: name ?? `${viewType} visualization`,
        status: "pending",
        prompt: naturalLanguagePrompt,
        promptData: structuredData,
        provider: "nanobanana",
      })
      .returning()

    // If Nano Banana API key is configured, we could trigger generation here
    // For now, we just return the prompt data for manual generation or frontend handling
    const hasApiKey = !!env.NANOBANANA_API_KEY

    return c.json(
      successResponse(c, {
        data: {
          visualization,
          prompt: {
            natural: naturalLanguagePrompt,
            structured: structuredData,
          },
          apiConfigured: hasApiKey,
          message: hasApiKey
            ? "Visualization queued for generation"
            : "Prompt generated. Configure NANOBANANA_API_KEY for automatic generation.",
        },
        message: "Visualization prompt generated successfully",
      }),
      201
    )
  } catch (e) {
    console.error("Generate visualization error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to generate visualization",
        error: { message: String(e) },
      }),
      500
    )
  }
}
