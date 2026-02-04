import type { Context } from "hono"
import { successResponse, failedResponse, formatZodErrors } from "../../../utils/response/helpers"
import { GenerateRenderSchema } from "../../../types/finish"
import {
  generateTopDownRender,
  generateFirstPersonRender,
  getRenderHistory,
  getRenderProviderStatus,
} from "../../../service/render"

/**
 * Generate a render (top-down or first-person)
 */
export async function generateRenderHandler(c: Context) {
  try {
    const body = await c.req.json()
    const parsed = GenerateRenderSchema.safeParse(body)

    if (!parsed.success) {
      return c.json(
        failedResponse(c, {
          message: "Validation failed",
          error: formatZodErrors(parsed.error),
        }),
        400
      )
    }

    // Check if any render provider is available
    const providerStatus = getRenderProviderStatus()
    if (!providerStatus.available) {
      return c.json(
        failedResponse(c, {
          message: "Render service not available - no image generation provider configured",
        }),
        503
      )
    }

    const { blueprintId, type, quality } = parsed.data

    let result
    if (type === "topdown") {
      result = await generateTopDownRender(blueprintId, quality)
    } else {
      result = await generateFirstPersonRender(blueprintId, quality)
    }

    if (!result.success) {
      return c.json(
        failedResponse(c, {
          message: result.error || "Render generation failed",
        }),
        500
      )
    }

    return c.json(
      successResponse(c, {
        data: {
          renderId: result.renderId,
          url: result.url,
          type,
          quality,
          provider: result.provider,
        },
        message: `${type === "topdown" ? "Top-down" : "First-person"} render generated successfully using ${result.provider}`,
      }),
      200
    )
  } catch (e) {
    console.error("Generate render error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to generate render",
        error: { message: String(e) },
      }),
      500
    )
  }
}

/**
 * Get render history for a blueprint
 */
export async function getRenderHistoryHandler(c: Context) {
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

    const history = await getRenderHistory(blueprintId)

    return c.json(
      successResponse(c, {
        data: { history },
        message: "Render history retrieved successfully",
      }),
      200
    )
  } catch (e) {
    console.error("Get render history error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to get render history",
        error: { message: String(e) },
      }),
      500
    )
  }
}

/**
 * Check render service status
 */
export async function getRenderStatusHandler(c: Context) {
  try {
    const status = getRenderProviderStatus()

    return c.json(
      successResponse(c, {
        data: {
          available: status.available,
          provider: status.provider,
        },
        message: status.available
          ? `Render service is available (using ${status.provider})`
          : "Render service not configured",
      }),
      200
    )
  } catch (e) {
    console.error("Get render status error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to check render status",
        error: { message: String(e) },
      }),
      500
    )
  }
}
