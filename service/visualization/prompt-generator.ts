/**
 * AI Prompt Generator for Nano Banana
 *
 * Generates detailed prompts with exact coordinates for accurate 3D visualization
 */

import type { Room, Door, Window, Furniture } from "../../schema"
import { pixelsToFeet } from "../../utils/geo/coordinate-converter"

export type VisualizationType =
  | "exterior_front"
  | "exterior_back"
  | "exterior_side"
  | "exterior_aerial"
  | "interior_living"
  | "interior_bedroom"
  | "interior_bathroom"
  | "interior_kitchen"
  | "floor_plan_3d"
  | "custom"

export interface BlueprintData {
  aduBoundary: Array<{ x: number; y: number }>
  aduAreaSqFt: number
  canvasWidth: number
  canvasHeight: number
  pixelsPerFoot: number
  rooms: Room[]
  doors: Door[]
  windows: Window[]
  furniture: Furniture[]
}

export interface RoomFinish {
  roomId: string
  roomName: string
  roomType: string
  vibe: string
  tier: string
  lifestyle: string[]
  customNotes?: string
}

export interface FinishesData {
  globalTemplate?: string
  globalTier: string
  roomFinishes: RoomFinish[]
}

export interface PromptConfig {
  viewType: VisualizationType
  style?: string  // e.g., "photorealistic", "architectural rendering", "sketch"
  timeOfDay?: string  // e.g., "midday", "golden hour", "dusk"
  weather?: string  // e.g., "sunny", "overcast"
  includeContext?: boolean  // Include surrounding context
}

/**
 * Convert room data to a natural language description with coordinates
 */
function describeRoom(
  room: Room,
  pixelsPerFoot: number,
  canvasCenter: { x: number; y: number }
): string {
  const vertices = room.vertices as Array<{ x: number; y: number }>

  // Convert vertices to feet from center
  const verticesFeet = vertices.map(v => ({
    x: pixelsToFeet(v.x - canvasCenter.x, pixelsPerFoot).toFixed(1),
    y: pixelsToFeet(canvasCenter.y - v.y, pixelsPerFoot).toFixed(1),
  }))

  // Calculate centroid
  const centroid = {
    x: (vertices.reduce((sum, v) => sum + v.x, 0) / vertices.length),
    y: (vertices.reduce((sum, v) => sum + v.y, 0) / vertices.length),
  }
  const centroidFeet = {
    x: pixelsToFeet(centroid.x - canvasCenter.x, pixelsPerFoot).toFixed(1),
    y: pixelsToFeet(canvasCenter.y - centroid.y, pixelsPerFoot).toFixed(1),
  }

  return `${room.name} (${room.type}): ${room.areaSqFt} sq ft, centered at (${centroidFeet.x}', ${centroidFeet.y}'), corners at ${verticesFeet.map(v => `(${v.x}', ${v.y}')`).join(", ")}`
}

/**
 * Convert door data to description
 */
function describeDoor(
  door: Door,
  pixelsPerFoot: number,
  canvasCenter: { x: number; y: number }
): string {
  const positionFeet = {
    x: pixelsToFeet(door.x - canvasCenter.x, pixelsPerFoot).toFixed(1),
    y: pixelsToFeet(canvasCenter.y - door.y, pixelsPerFoot).toFixed(1),
  }

  const doorTypes: Record<string, string> = {
    single: "single swing door",
    double: "double doors",
    sliding: "sliding glass door",
    french: "French doors",
    open_passage: "open passage/archway",
  }

  return `${doorTypes[door.type] || door.type} (${door.widthFeet}' wide) at position (${positionFeet.x}', ${positionFeet.y}'), rotated ${door.rotation ?? 0}°${door.isExterior ? ", exterior" : ""}`
}

/**
 * Convert window data to description
 */
function describeWindow(
  window: Window,
  pixelsPerFoot: number,
  canvasCenter: { x: number; y: number }
): string {
  const positionFeet = {
    x: pixelsToFeet(window.x - canvasCenter.x, pixelsPerFoot).toFixed(1),
    y: pixelsToFeet(canvasCenter.y - window.y, pixelsPerFoot).toFixed(1),
  }

  const windowTypes: Record<string, string> = {
    standard: "standard window",
    bay: "bay window",
    picture: "large picture window",
    sliding: "sliding window",
  }

  return `${windowTypes[window.type] || window.type} (${window.widthFeet}' × ${window.heightFeet}') at position (${positionFeet.x}', ${positionFeet.y}')`
}

/**
 * Convert furniture data to description
 */
function describeFurniture(
  item: Furniture,
  pixelsPerFoot: number,
  canvasCenter: { x: number; y: number }
): string {
  const positionFeet = {
    x: pixelsToFeet(item.x - canvasCenter.x, pixelsPerFoot).toFixed(1),
    y: pixelsToFeet(canvasCenter.y - item.y, pixelsPerFoot).toFixed(1),
  }

  const furnitureNames: Record<string, string> = {
    queen_bed: "queen-size bed",
    king_bed: "king-size bed",
    twin_bed: "twin bed",
    sofa: "sofa",
    loveseat: "loveseat",
    dining_table: "dining table",
    refrigerator: "refrigerator",
    stove: "stove/range",
    toilet: "toilet",
    bathtub: "bathtub",
    shower: "walk-in shower",
    sink_vanity: "bathroom vanity with sink",
  }

  return `${furnitureNames[item.type] || item.type} (${item.widthFeet}' × ${item.heightFeet}') at position (${positionFeet.x}', ${positionFeet.y}'), rotated ${item.rotation ?? 0}°`
}

/**
 * Generate the structured prompt data for AI
 */
export function generatePromptData(
  blueprint: BlueprintData,
  finishes?: FinishesData,
  config?: PromptConfig
): {
  structuredData: Record<string, unknown>
  naturalLanguagePrompt: string
} {
  const canvasCenter = {
    x: blueprint.canvasWidth / 2,
    y: blueprint.canvasHeight / 2,
  }

  // Build structured data with exact coordinates
  const structuredData = {
    aduDimensions: {
      totalAreaSqFt: blueprint.aduAreaSqFt,
      boundaryVerticesFeet: blueprint.aduBoundary.map(v => ({
        x: parseFloat(pixelsToFeet(v.x - canvasCenter.x, blueprint.pixelsPerFoot).toFixed(2)),
        y: parseFloat(pixelsToFeet(canvasCenter.y - v.y, blueprint.pixelsPerFoot).toFixed(2)),
      })),
    },
    rooms: blueprint.rooms.map(room => {
      const vertices = room.vertices as Array<{ x: number; y: number }>
      return {
        name: room.name,
        type: room.type,
        areaSqFt: room.areaSqFt,
        verticesFeet: vertices.map(v => ({
          x: parseFloat(pixelsToFeet(v.x - canvasCenter.x, blueprint.pixelsPerFoot).toFixed(2)),
          y: parseFloat(pixelsToFeet(canvasCenter.y - v.y, blueprint.pixelsPerFoot).toFixed(2)),
        })),
      }
    }),
    doors: blueprint.doors.map(door => ({
      type: door.type,
      widthFeet: door.widthFeet,
      positionFeet: {
        x: parseFloat(pixelsToFeet(door.x - canvasCenter.x, blueprint.pixelsPerFoot).toFixed(2)),
        y: parseFloat(pixelsToFeet(canvasCenter.y - door.y, blueprint.pixelsPerFoot).toFixed(2)),
      },
      rotation: door.rotation ?? 0,
      isExterior: door.isExterior ?? false,
    })),
    windows: blueprint.windows.map(win => ({
      type: win.type,
      widthFeet: win.widthFeet,
      heightFeet: win.heightFeet,
      positionFeet: {
        x: parseFloat(pixelsToFeet(win.x - canvasCenter.x, blueprint.pixelsPerFoot).toFixed(2)),
        y: parseFloat(pixelsToFeet(canvasCenter.y - win.y, blueprint.pixelsPerFoot).toFixed(2)),
      },
      rotation: win.rotation ?? 0,
    })),
    furniture: blueprint.furniture.map(item => ({
      type: item.type,
      category: item.category,
      widthFeet: item.widthFeet,
      heightFeet: item.heightFeet,
      positionFeet: {
        x: parseFloat(pixelsToFeet(item.x - canvasCenter.x, blueprint.pixelsPerFoot).toFixed(2)),
        y: parseFloat(pixelsToFeet(canvasCenter.y - item.y, blueprint.pixelsPerFoot).toFixed(2)),
      },
      rotation: item.rotation ?? 0,
    })),
    finishes: finishes ?? {},
    viewType: config?.viewType ?? "exterior_front",
    style: config?.style ?? "photorealistic",
  }

  // Build natural language prompt
  const roomDescriptions = blueprint.rooms
    .map(r => describeRoom(r, blueprint.pixelsPerFoot, canvasCenter))
    .join("\n  - ")

  const doorDescriptions = blueprint.doors
    .map(d => describeDoor(d, blueprint.pixelsPerFoot, canvasCenter))
    .join("\n  - ")

  const windowDescriptions = blueprint.windows
    .map(w => describeWindow(w, blueprint.pixelsPerFoot, canvasCenter))
    .join("\n  - ")

  const furnitureDescriptions = blueprint.furniture
    .map(f => describeFurniture(f, blueprint.pixelsPerFoot, canvasCenter))
    .join("\n  - ")

  // Finishes description - using vibe-based system
  let finishesDescription = ""
  if (finishes && finishes.roomFinishes.length > 0) {
    const vibeDescriptions: Record<string, string> = {
      modern_minimal: "clean lines, neutral colors, minimalist aesthetic with white walls and natural light",
      scandinavian: "light wood tones, cozy textiles, hygge atmosphere with white and soft grays",
      industrial: "exposed brick, metal accents, concrete elements, Edison bulbs",
      bohemian: "layered textiles, plants, warm earthy colors, eclectic decor",
      midcentury: "mid-century modern furniture, warm wood, organic curves, vintage touches",
      coastal: "beach-inspired, light blues, sandy neutrals, natural textures",
      farmhouse: "rustic wood, shiplap, vintage accents, warm whites",
      luxury: "premium materials, elegant finishes, rich textures, sophisticated palette",
    }

    const tierDescriptions: Record<string, string> = {
      budget: "cost-effective materials, basic finishes",
      standard: "quality materials, mid-range finishes",
      premium: "high-end materials, luxury finishes",
    }

    // Group rooms by vibe
    const vibeGroups = new Map<string, string[]>()
    for (const rf of finishes.roomFinishes) {
      const rooms = vibeGroups.get(rf.vibe) || []
      rooms.push(rf.roomName)
      vibeGroups.set(rf.vibe, rooms)
    }

    const parts: string[] = []
    for (const [vibe, roomNames] of vibeGroups) {
      const vibeDesc = vibeDescriptions[vibe] || vibe
      parts.push(`${roomNames.join(", ")}: ${vibeDesc}`)
    }

    parts.push(`Overall quality tier: ${tierDescriptions[finishes.globalTier] || finishes.globalTier}`)

    if (finishes.globalTemplate) {
      parts.push(`Design template: ${finishes.globalTemplate.replace(/_/g, " ")}`)
    }

    finishesDescription = parts.join("\n")
  }

  // View-specific instructions
  const viewInstructions: Record<VisualizationType, string> = {
    exterior_front: "Front exterior view showing the main entrance and facade",
    exterior_back: "Rear exterior view showing the back of the ADU",
    exterior_side: "Side exterior view",
    exterior_aerial: "Aerial/bird's eye view showing the roof and overall footprint",
    interior_living: "Interior view of the living room/main living space",
    interior_bedroom: "Interior view of the bedroom",
    interior_bathroom: "Interior view of the bathroom",
    interior_kitchen: "Interior view of the kitchen",
    floor_plan_3d: "3D isometric view of the floor plan showing room layout",
    custom: "Custom view as specified",
  }

  const naturalLanguagePrompt = `
Generate a ${config?.style ?? "photorealistic"} visualization of an Accessory Dwelling Unit (ADU).

## ADU Specifications
Total area: ${blueprint.aduAreaSqFt} square feet

## Room Layout (all coordinates in feet from center)
  - ${roomDescriptions}

## Doors
  - ${doorDescriptions}

## Windows
  - ${windowDescriptions}

## Furniture Placement
  - ${furnitureDescriptions}

## Finishes & Style
${finishesDescription || "Modern contemporary style with neutral tones"}

## View
${viewInstructions[config?.viewType ?? "exterior_front"]}
${config?.timeOfDay ? `Time of day: ${config.timeOfDay}` : ""}
${config?.weather ? `Weather: ${config.weather}` : ""}

Please generate an accurate visualization based on these exact specifications and coordinates.
`.trim()

  return {
    structuredData,
    naturalLanguagePrompt,
  }
}
