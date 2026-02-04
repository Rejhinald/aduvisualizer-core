/**
 * Render Service
 *
 * Orchestrates the generation of 3D renders using Pollinations AI (free) or Gemini (fallback)
 * - Top-down view: Bird's eye 3D view of the entire floor plan
 * - First-person view: Interior view from camera position
 */

import { v4 as uuidv4 } from "uuid"
import { db } from "../../config/db"
import { finishes, blueprints, rooms, doors, windows, furniture } from "../../schema"
import type { CameraPlacement, RenderRecord } from "../../schema/finishes"
import { eq, and } from "drizzle-orm"
import { sql } from "drizzle-orm"
import {
  generateImage as generatePollinationsImage,
  isPollinationsAvailable,
  type RenderQuality,
} from "./pollinations-client"
import {
  generateImage as generateGeminiImage,
  isGeminiAvailable,
} from "./gemini-client"
import { buildTopDownPrompt, buildFirstPersonPrompt, type BlueprintData } from "./prompt-builder"
import { saveRenderToLocal, getRenderUrl } from "./storage"

// Re-export RenderQuality for external use
export type { RenderQuality }

export interface RenderResult {
  success: boolean
  renderId?: string
  url?: string
  prompt?: string
  provider?: "pollinations" | "gemini"
  error?: string
}

/**
 * Get the available render provider
 */
function getProvider(): "pollinations" | "gemini" | null {
  // Prefer Pollinations (free, no API key needed)
  if (isPollinationsAvailable()) return "pollinations"
  // Fall back to Gemini if configured
  if (isGeminiAvailable()) return "gemini"
  return null
}

/**
 * Generate image using the best available provider
 */
async function generateImageWithProvider(
  prompt: string,
  quality: RenderQuality,
  aspectRatio: "4:3" | "16:9"
): Promise<{ success: boolean; imageBase64?: string; mimeType?: string; provider?: string; error?: string }> {
  const provider = getProvider()

  if (!provider) {
    return { success: false, error: "No image generation provider available" }
  }

  // Calculate dimensions based on aspect ratio
  const baseSize = quality === "final" ? 1280 : 1024
  let width: number
  let height: number

  if (aspectRatio === "4:3") {
    width = baseSize
    height = Math.round(baseSize * 0.75) // 4:3 ratio
  } else {
    width = baseSize
    height = Math.round(baseSize * 0.5625) // 16:9 ratio
  }

  if (provider === "pollinations") {
    console.log("[RenderService] Using Pollinations AI for image generation")
    const result = await generatePollinationsImage({
      prompt,
      quality,
      width,
      height,
      model: "zimage", // Fastest/cheapest model - ~$0.0002/img
      enhance: quality === "final",
    })
    return { ...result, provider: "pollinations" }
  }

  if (provider === "gemini") {
    console.log("[RenderService] Using Gemini for image generation")
    const result = await generateGeminiImage({
      prompt,
      quality,
      aspectRatio,
    })
    return { ...result, provider: "gemini" }
  }

  return { success: false, error: "Unknown provider" }
}

/**
 * Get blueprint data for rendering
 */
async function getBlueprintData(blueprintId: string): Promise<BlueprintData | null> {
  try {
    const [blueprint] = await db
      .select()
      .from(blueprints)
      .where(and(eq(blueprints.id, blueprintId), eq(blueprints.isDeleted, false)))
      .limit(1)

    if (!blueprint) return null

    // Get rooms for this blueprint
    const roomsData = await db
      .select()
      .from(rooms)
      .where(and(eq(rooms.blueprintId, blueprintId), eq(rooms.isDeleted, false)))

    // Get doors for this blueprint
    const doorsData = await db
      .select()
      .from(doors)
      .where(and(eq(doors.blueprintId, blueprintId), eq(doors.isDeleted, false)))

    // Get windows for this blueprint
    const windowsData = await db
      .select()
      .from(windows)
      .where(and(eq(windows.blueprintId, blueprintId), eq(windows.isDeleted, false)))

    // Get furniture for this blueprint
    const furnitureData = await db
      .select()
      .from(furniture)
      .where(and(eq(furniture.blueprintId, blueprintId), eq(furniture.isDeleted, false)))

    // Transform data to match BlueprintData interface
    const blueprintRooms: BlueprintData["rooms"] = roomsData.map(r => ({
      id: r.id,
      name: r.name,
      type: r.type,
      areaSqFt: r.areaSqFt,
      vertices: (r.vertices as Array<{ x: number; y: number }>) || [],
    }))

    const blueprintDoors: BlueprintData["doors"] = doorsData.map(d => ({
      id: d.id,
      type: d.type,
      position: { x: d.x, y: d.y },
      rotation: d.rotation ?? 0,
      widthFeet: d.widthFeet,
    }))

    const blueprintWindows: BlueprintData["windows"] = windowsData.map(w => ({
      id: w.id,
      type: w.type,
      position: { x: w.x, y: w.y },
      rotation: w.rotation ?? 0,
      widthFeet: w.widthFeet,
      heightFeet: w.heightFeet,
    }))

    const blueprintFurniture: BlueprintData["furniture"] = furnitureData.map(f => ({
      id: f.id,
      type: f.type,
      position: { x: f.x, y: f.y },
      rotation: f.rotation ?? 0,
      widthFeet: f.widthFeet,
      heightFeet: f.heightFeet,
    }))

    const aduBoundary = (blueprint.aduBoundary as Array<{ x: number; y: number }>) || []

    // Calculate total area from rooms
    const totalAreaSqFt = blueprintRooms.reduce((sum, r) => sum + (r.areaSqFt || 0), 0)

    return {
      totalAreaSqFt,
      rooms: blueprintRooms,
      doors: blueprintDoors,
      windows: blueprintWindows,
      furniture: blueprintFurniture,
      aduBoundary,
      pixelsPerFoot: blueprint.pixelsPerFoot || 22.22,
    }
  } catch (error) {
    console.error("[RenderService] Error getting blueprint data:", error)
    return null
  }
}

/**
 * Generate top-down 3D render
 */
export async function generateTopDownRender(
  blueprintId: string,
  quality: RenderQuality = "preview"
): Promise<RenderResult> {
  const provider = getProvider()
  if (!provider) {
    return { success: false, error: "No image generation provider available. Pollinations AI is free and requires no setup." }
  }

  try {
    // Get blueprint data
    const blueprintData = await getBlueprintData(blueprintId)
    if (!blueprintData) {
      return { success: false, error: "Blueprint not found" }
    }

    // Get finishes
    const [finish] = await db
      .select()
      .from(finishes)
      .where(and(eq(finishes.blueprintId, blueprintId), eq(finishes.isDeleted, false)))
      .limit(1)

    if (!finish) {
      return { success: false, error: "Finishes not found - please set up finishes first" }
    }

    // Build prompt
    const prompt = buildTopDownPrompt(blueprintData, finish)

    console.log("[RenderService] Generating top-down render...")
    console.log("[RenderService] Prompt length:", prompt.length, "characters")

    // Generate image
    const result = await generateImageWithProvider(prompt, quality, "4:3")

    if (!result.success || !result.imageBase64) {
      return { success: false, error: result.error || "Image generation failed" }
    }

    // Save to local storage
    const renderId = uuidv4()
    const filename = `${blueprintId}/topdown_${quality}_${renderId}.png`
    await saveRenderToLocal(filename, result.imageBase64, result.mimeType || "image/png")
    const url = getRenderUrl(filename)

    // Create render record
    const renderRecord: RenderRecord = {
      id: renderId,
      type: "topdown",
      quality,
      url,
      prompt,
      generatedAt: new Date().toISOString(),
    }

    // Update finishes with new render
    const urlField = quality === "final" ? "topDownFinalUrl" : "topDownPreviewUrl"
    const existingHistory = (finish.renderHistory as RenderRecord[]) || []

    await db
      .update(finishes)
      .set({
        [urlField]: url,
        renderHistory: [...existingHistory, renderRecord],
        updatedAt: sql`now()`,
      })
      .where(eq(finishes.id, finish.id))

    console.log("[RenderService] Top-down render saved:", url)

    return {
      success: true,
      renderId,
      url,
      prompt,
      provider: result.provider as "pollinations" | "gemini",
    }
  } catch (error) {
    console.error("[RenderService] Top-down render error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Generate first-person render from camera position
 */
export async function generateFirstPersonRender(
  blueprintId: string,
  quality: RenderQuality = "preview"
): Promise<RenderResult> {
  const provider = getProvider()
  if (!provider) {
    return { success: false, error: "No image generation provider available. Pollinations AI is free and requires no setup." }
  }

  try {
    // Get blueprint data
    const blueprintData = await getBlueprintData(blueprintId)
    if (!blueprintData) {
      return { success: false, error: "Blueprint not found" }
    }

    // Get finishes with camera placement
    const [finish] = await db
      .select()
      .from(finishes)
      .where(and(eq(finishes.blueprintId, blueprintId), eq(finishes.isDeleted, false)))
      .limit(1)

    if (!finish) {
      return { success: false, error: "Finishes not found - please set up finishes first" }
    }

    const camera = finish.cameraPlacement as CameraPlacement | null
    if (!camera) {
      return { success: false, error: "Camera not placed - please position the camera first" }
    }

    // Build prompt
    const prompt = buildFirstPersonPrompt(blueprintData, finish, camera)

    console.log("[RenderService] Generating first-person render...")
    console.log("[RenderService] Prompt length:", prompt.length, "characters")

    // Generate image
    const result = await generateImageWithProvider(prompt, quality, "16:9")

    if (!result.success || !result.imageBase64) {
      return { success: false, error: result.error || "Image generation failed" }
    }

    // Save to local storage
    const renderId = uuidv4()
    const filename = `${blueprintId}/firstperson_${quality}_${renderId}.png`
    await saveRenderToLocal(filename, result.imageBase64, result.mimeType || "image/png")
    const url = getRenderUrl(filename)

    // Create render record
    const renderRecord: RenderRecord = {
      id: renderId,
      type: "firstperson",
      quality,
      url,
      prompt,
      generatedAt: new Date().toISOString(),
    }

    // Update finishes with new render
    const urlField = quality === "final" ? "firstPersonFinalUrl" : "firstPersonPreviewUrl"
    const existingHistory = (finish.renderHistory as RenderRecord[]) || []

    await db
      .update(finishes)
      .set({
        [urlField]: url,
        renderHistory: [...existingHistory, renderRecord],
        updatedAt: sql`now()`,
      })
      .where(eq(finishes.id, finish.id))

    console.log("[RenderService] First-person render saved:", url)

    return {
      success: true,
      renderId,
      url,
      prompt,
      provider: result.provider as "pollinations" | "gemini",
    }
  } catch (error) {
    console.error("[RenderService] First-person render error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Check which render provider is available
 */
export function getRenderProviderStatus(): { available: boolean; provider: string } {
  const provider = getProvider()
  return {
    available: provider !== null,
    provider: provider || "none",
  }
}

/**
 * Get render status/history for a blueprint
 */
export async function getRenderHistory(blueprintId: string): Promise<RenderRecord[]> {
  try {
    const [finish] = await db
      .select({ renderHistory: finishes.renderHistory })
      .from(finishes)
      .where(and(eq(finishes.blueprintId, blueprintId), eq(finishes.isDeleted, false)))
      .limit(1)

    return (finish?.renderHistory as RenderRecord[]) || []
  } catch (error) {
    console.error("[RenderService] Error getting render history:", error)
    return []
  }
}
