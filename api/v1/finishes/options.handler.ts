import type { Context } from "hono"
import { successResponse } from "../../../utils/response/helpers"
import {
  TEMPLATE_DEFINITIONS,
  VIBE_DEFINITIONS,
  LIFESTYLE_OPTIONS,
} from "../../../types/finish"

/**
 * Returns all available options for the finishes UI
 * - Templates with descriptions
 * - Vibes with colors/materials
 * - Lifestyle options by room type
 * - Tier options
 */
export async function getOptionsHandler(c: Context) {
  try {
    // Transform definitions to arrays for easier frontend consumption
    const templates = Object.entries(TEMPLATE_DEFINITIONS).map(([id, def]) => ({
      id,
      ...def,
    }))

    const vibes = Object.entries(VIBE_DEFINITIONS).map(([id, def]) => ({
      id,
      ...def,
    }))

    const tiers = [
      {
        id: "budget",
        label: "Budget",
        description: "Cost-effective materials, standard finishes",
      },
      {
        id: "standard",
        label: "Standard",
        description: "Quality materials, mid-range finishes",
      },
      {
        id: "premium",
        label: "Premium",
        description: "High-end materials, luxury finishes",
      },
    ]

    // Convert to Record<roomType, LifestyleOption[]> format for frontend
    const lifestylesByRoomType: Record<string, Array<{ id: string; label: string }>> = {}
    for (const [roomType, options] of Object.entries(LIFESTYLE_OPTIONS)) {
      lifestylesByRoomType[roomType] = options.map(opt => ({
        id: opt,
        label: opt
          .split("-")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
      }))
    }

    return c.json(
      successResponse(c, {
        data: {
          templates,
          vibes,
          tiers,
          lifestylesByRoomType,
        },
        message: "Options retrieved successfully",
      }),
      200
    )
  } catch (e) {
    console.error("Get options error:", e)
    return c.json(
      {
        success: false,
        message: "Failed to get options",
        error: { message: String(e) },
      },
      500
    )
  }
}
