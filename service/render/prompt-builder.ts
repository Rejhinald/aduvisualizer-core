/**
 * Prompt Builder for ADU Renders
 *
 * Generates optimized prompts for Gemini image generation with full spatial data
 * - Includes actual room positions and dimensions
 * - Describes room adjacencies and connections
 * - Places doors and windows on specific walls
 * - Positions furniture within rooms
 */

import type { Finish, RoomFinish, CameraPlacement } from "../../schema/finishes"
import { VIBE_DEFINITIONS, TEMPLATE_DEFINITIONS, type Vibe, type Template } from "../../types/finish"

export interface BlueprintData {
  totalAreaSqFt: number
  rooms: Array<{
    id: string
    name: string
    type: string
    areaSqFt: number
    vertices: Array<{ x: number; y: number }>
  }>
  doors: Array<{
    id: string
    type: string
    position: { x: number; y: number }
    rotation: number
    widthFeet: number
  }>
  windows: Array<{
    id: string
    type: string
    position: { x: number; y: number }
    rotation: number
    widthFeet: number
    heightFeet: number
  }>
  furniture: Array<{
    id: string
    type: string
    position: { x: number; y: number }
    rotation: number
    widthFeet: number
    heightFeet: number
  }>
  aduBoundary: Array<{ x: number; y: number }>
  pixelsPerFoot: number
}

interface RoomSpatialData {
  id: string
  name: string
  type: string
  areaSqFt: number
  centerX: number // in feet from ADU origin
  centerY: number // in feet from ADU origin
  width: number // in feet
  height: number // in feet
  vertices: Array<{ x: number; y: number }> // in feet
}

interface DoorSpatialData {
  id: string
  type: string
  x: number // in feet
  y: number // in feet
  widthFeet: number
  rotation: number
  connectsRooms: string[] // room names this door connects
  wallDirection: string // north, south, east, west
}

interface WindowSpatialData {
  id: string
  type: string
  x: number // in feet
  y: number // in feet
  widthFeet: number
  heightFeet: number
  rotation: number
  inRoom: string // room name
  wallDirection: string
}

interface FurnitureSpatialData {
  id: string
  type: string
  name: string
  x: number // in feet
  y: number // in feet
  widthFeet: number
  heightFeet: number
  rotation: number
  inRoom: string // room name
  positionDescription: string // e.g., "against the north wall"
}

/**
 * Convert pixel coordinate to feet
 */
function pixelsToFeet(pixels: number, pixelsPerFoot: number): number {
  return pixels / pixelsPerFoot
}

/**
 * Calculate the center point of a polygon
 */
function calculateCentroid(vertices: Array<{ x: number; y: number }>): { x: number; y: number } {
  if (vertices.length === 0) return { x: 0, y: 0 }
  const sum = vertices.reduce((acc, v) => ({ x: acc.x + v.x, y: acc.y + v.y }), { x: 0, y: 0 })
  return { x: sum.x / vertices.length, y: sum.y / vertices.length }
}

/**
 * Calculate bounding box of vertices
 */
function calculateBoundingBox(vertices: Array<{ x: number; y: number }>): {
  minX: number
  maxX: number
  minY: number
  maxY: number
  width: number
  height: number
} {
  if (vertices.length === 0) return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 }
  const xs = vertices.map(v => v.x)
  const ys = vertices.map(v => v.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY }
}

/**
 * Check if a point is inside a polygon using ray casting
 */
function isPointInPolygon(point: { x: number; y: number }, polygon: Array<{ x: number; y: number }>): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y
    const xj = polygon[j].x, yj = polygon[j].y
    if (((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
      inside = !inside
    }
  }
  return inside
}

/**
 * Get cardinal direction from rotation angle
 */
function rotationToDirection(rotation: number): string {
  const normalized = ((rotation % 360) + 360) % 360
  if (normalized >= 315 || normalized < 45) return "east"
  if (normalized >= 45 && normalized < 135) return "south"
  if (normalized >= 135 && normalized < 225) return "west"
  return "north"
}

/**
 * Get human-readable furniture name
 */
function getFurnitureName(type: string): string {
  const names: Record<string, string> = {
    "bed-queen": "queen bed",
    "bed-king": "king bed",
    "bed-double": "double bed",
    "bed-single": "single bed",
    "sofa-3seat": "3-seater sofa",
    "sofa-2seat": "loveseat",
    "sofa-sectional": "sectional sofa",
    "table-dining": "dining table",
    "table-coffee": "coffee table",
    "table-side": "side table",
    "chair-dining": "dining chair",
    "chair-armchair": "armchair",
    "desk": "desk",
    "refrigerator": "refrigerator",
    "stove": "stove",
    "dishwasher": "dishwasher",
    "sink": "sink",
    "toilet": "toilet",
    "bathtub": "bathtub",
    "shower": "shower",
    "vanity": "vanity",
    "washer": "washer",
    "dryer": "dryer",
  }
  return names[type] || type.replace(/-/g, " ")
}

/**
 * Describe position relative to room center
 */
function describePositionInRoom(
  itemX: number,
  itemY: number,
  roomCenterX: number,
  roomCenterY: number,
  roomWidth: number,
  roomHeight: number
): string {
  const dx = itemX - roomCenterX
  const dy = itemY - roomCenterY

  const xThreshold = roomWidth * 0.25
  const yThreshold = roomHeight * 0.25

  const parts: string[] = []

  if (Math.abs(dy) > yThreshold) {
    parts.push(dy < 0 ? "north" : "south")
  }
  if (Math.abs(dx) > xThreshold) {
    parts.push(dx < 0 ? "west" : "east")
  }

  if (parts.length === 0) return "in the center"
  if (parts.length === 1) return `on the ${parts[0]} side`
  return `in the ${parts.join("-")} corner`
}

/**
 * Calculate ADU origin (top-left corner of bounding box)
 */
function calculateAduOrigin(boundary: Array<{ x: number; y: number }>, pixelsPerFoot: number): { x: number; y: number } {
  const box = calculateBoundingBox(boundary)
  return {
    x: pixelsToFeet(box.minX, pixelsPerFoot),
    y: pixelsToFeet(box.minY, pixelsPerFoot),
  }
}

/**
 * Process rooms into spatial data
 */
function processRooms(
  rooms: BlueprintData["rooms"],
  pixelsPerFoot: number,
  aduOrigin: { x: number; y: number }
): RoomSpatialData[] {
  return rooms.map(room => {
    const verticesFeet = room.vertices.map(v => ({
      x: pixelsToFeet(v.x, pixelsPerFoot) - aduOrigin.x,
      y: pixelsToFeet(v.y, pixelsPerFoot) - aduOrigin.y,
    }))
    const center = calculateCentroid(verticesFeet)
    const box = calculateBoundingBox(verticesFeet)

    return {
      id: room.id,
      name: room.name,
      type: room.type,
      areaSqFt: room.areaSqFt,
      centerX: Math.round(center.x * 10) / 10,
      centerY: Math.round(center.y * 10) / 10,
      width: Math.round(box.width * 10) / 10,
      height: Math.round(box.height * 10) / 10,
      vertices: verticesFeet.map(v => ({
        x: Math.round(v.x * 10) / 10,
        y: Math.round(v.y * 10) / 10,
      })),
    }
  })
}

/**
 * Find which room a point is in
 */
function findRoomForPoint(
  point: { x: number; y: number },
  rooms: RoomSpatialData[]
): RoomSpatialData | null {
  for (const room of rooms) {
    if (isPointInPolygon(point, room.vertices)) {
      return room
    }
  }
  // If not inside any room, find closest room
  let closest: RoomSpatialData | null = null
  let minDist = Infinity
  for (const room of rooms) {
    const dx = point.x - room.centerX
    const dy = point.y - room.centerY
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < minDist) {
      minDist = dist
      closest = room
    }
  }
  return closest
}

/**
 * Process doors into spatial data
 */
function processDoors(
  doors: BlueprintData["doors"],
  rooms: RoomSpatialData[],
  pixelsPerFoot: number,
  aduOrigin: { x: number; y: number }
): DoorSpatialData[] {
  return doors.map(door => {
    const x = pixelsToFeet(door.position.x, pixelsPerFoot) - aduOrigin.x
    const y = pixelsToFeet(door.position.y, pixelsPerFoot) - aduOrigin.y

    // Find rooms this door might connect (within threshold)
    const connectsRooms: string[] = []
    const threshold = 3 // feet
    for (const room of rooms) {
      const dx = Math.abs(x - room.centerX)
      const dy = Math.abs(y - room.centerY)
      const roomRadius = Math.max(room.width, room.height) / 2 + threshold
      if (Math.sqrt(dx * dx + dy * dy) < roomRadius) {
        connectsRooms.push(room.name)
      }
    }

    return {
      id: door.id,
      type: door.type,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      widthFeet: door.widthFeet,
      rotation: door.rotation,
      connectsRooms: connectsRooms.slice(0, 2), // Max 2 rooms
      wallDirection: rotationToDirection(door.rotation),
    }
  })
}

/**
 * Process windows into spatial data
 */
function processWindows(
  windows: BlueprintData["windows"],
  rooms: RoomSpatialData[],
  pixelsPerFoot: number,
  aduOrigin: { x: number; y: number }
): WindowSpatialData[] {
  return windows.map(window => {
    const x = pixelsToFeet(window.position.x, pixelsPerFoot) - aduOrigin.x
    const y = pixelsToFeet(window.position.y, pixelsPerFoot) - aduOrigin.y

    const room = findRoomForPoint({ x, y }, rooms)

    return {
      id: window.id,
      type: window.type,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      widthFeet: window.widthFeet,
      heightFeet: window.heightFeet,
      rotation: window.rotation,
      inRoom: room?.name || "exterior",
      wallDirection: rotationToDirection(window.rotation),
    }
  })
}

/**
 * Process furniture into spatial data
 */
function processFurniture(
  furniture: BlueprintData["furniture"],
  rooms: RoomSpatialData[],
  pixelsPerFoot: number,
  aduOrigin: { x: number; y: number }
): FurnitureSpatialData[] {
  return furniture.map(item => {
    const x = pixelsToFeet(item.position.x, pixelsPerFoot) - aduOrigin.x
    const y = pixelsToFeet(item.position.y, pixelsPerFoot) - aduOrigin.y

    const room = findRoomForPoint({ x, y }, rooms)
    const posDesc = room
      ? describePositionInRoom(x, y, room.centerX, room.centerY, room.width, room.height)
      : "in the space"

    return {
      id: item.id,
      type: item.type,
      name: getFurnitureName(item.type),
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      widthFeet: item.widthFeet,
      heightFeet: item.heightFeet,
      rotation: item.rotation,
      inRoom: room?.name || "open area",
      positionDescription: posDesc,
    }
  })
}

/**
 * Get vibe description for prompt
 */
function getVibeDescription(vibe: Vibe): string {
  const def = VIBE_DEFINITIONS[vibe]
  return `${def.label} (${def.description}). Colors: ${def.colors.join(", ")}. Materials: ${def.materials.join(", ")}.`
}

/**
 * Get tier quality description
 */
function getTierDescription(tier: string): string {
  switch (tier) {
    case "budget":
      return "budget-friendly, standard materials"
    case "standard":
      return "quality mid-range materials and finishes"
    case "premium":
      return "high-end luxury materials and designer finishes"
    default:
      return "standard materials"
  }
}

/**
 * Build TOP-DOWN render prompt with full spatial data
 */
export function buildTopDownPrompt(
  blueprint: BlueprintData,
  finish: Finish
): string {
  const roomFinishes = (finish.roomFinishes || []) as RoomFinish[]
  const globalTier = finish.globalTier || "standard"

  // Calculate ADU dimensions
  const aduBox = calculateBoundingBox(blueprint.aduBoundary)
  const aduWidth = pixelsToFeet(aduBox.width, blueprint.pixelsPerFoot)
  const aduHeight = pixelsToFeet(aduBox.height, blueprint.pixelsPerFoot)
  const aduOrigin = calculateAduOrigin(blueprint.aduBoundary, blueprint.pixelsPerFoot)

  // Process all spatial data
  const spatialRooms = processRooms(blueprint.rooms, blueprint.pixelsPerFoot, aduOrigin)
  const spatialDoors = processDoors(blueprint.doors, spatialRooms, blueprint.pixelsPerFoot, aduOrigin)
  const spatialWindows = processWindows(blueprint.windows, spatialRooms, blueprint.pixelsPerFoot, aduOrigin)
  const spatialFurniture = processFurniture(blueprint.furniture, spatialRooms, blueprint.pixelsPerFoot, aduOrigin)

  // Build room descriptions with positions
  const roomDescriptions = spatialRooms.map(room => {
    const finish = roomFinishes.find(rf => rf.roomId === room.id)
    const vibeDesc = finish ? getVibeDescription(finish.vibe as Vibe) : "modern minimal style"
    const tierDesc = finish ? getTierDescription(finish.tier) : getTierDescription(globalTier)

    return `  - ${room.name} (${room.type}):
      Position: center at (${room.centerX}', ${room.centerY}') from top-left origin
      Size: ${room.width}' wide × ${room.height}' deep (${room.areaSqFt} sq ft)
      Style: ${vibeDesc}
      Quality: ${tierDesc}`
  }).join("\n")

  // Build door descriptions
  const doorDescriptions = spatialDoors.map(door => {
    const connection = door.connectsRooms.length === 2
      ? `between ${door.connectsRooms[0]} and ${door.connectsRooms[1]}`
      : door.connectsRooms.length === 1
        ? `in ${door.connectsRooms[0]}`
        : "exterior"
    return `  - ${door.type} door (${door.widthFeet}' wide) at (${door.x}', ${door.y}'), facing ${door.wallDirection}, ${connection}`
  }).join("\n")

  // Build window descriptions
  const windowDescriptions = spatialWindows.map(window => {
    return `  - ${window.type} window (${window.widthFeet}'×${window.heightFeet}') at (${window.x}', ${window.y}') on ${window.wallDirection} wall of ${window.inRoom}`
  }).join("\n")

  // Build furniture descriptions grouped by room
  const furnitureByRoom = new Map<string, FurnitureSpatialData[]>()
  for (const item of spatialFurniture) {
    const list = furnitureByRoom.get(item.inRoom) || []
    list.push(item)
    furnitureByRoom.set(item.inRoom, list)
  }

  const furnitureDescriptions = Array.from(furnitureByRoom.entries()).map(([roomName, items]) => {
    const itemDescs = items.map(item =>
      `    - ${item.name} (${item.widthFeet}'×${item.heightFeet}') at (${item.x}', ${item.y}'), ${item.positionDescription}`
    ).join("\n")
    return `  ${roomName}:\n${itemDescs}`
  }).join("\n")

  return `Generate a 3D architectural visualization of an ADU (Accessory Dwelling Unit) floor plan from a TOP-DOWN bird's eye view perspective, looking straight down at approximately 60-degree angle.

## ADU DIMENSIONS
Total footprint: ${Math.round(aduWidth)}' wide × ${Math.round(aduHeight)}' deep
Total area: ${blueprint.totalAreaSqFt.toFixed(0)} square feet
Coordinate system: Origin (0,0) at top-left corner, X increases right, Y increases down

## ROOM LAYOUT (${blueprint.rooms.length} rooms)
${roomDescriptions}

## DOORS (${blueprint.doors.length} total)
${doorDescriptions || "  No doors placed"}

## WINDOWS (${blueprint.windows.length} total)
${windowDescriptions || "  No windows placed"}

## FURNITURE PLACEMENT
${furnitureDescriptions || "  No furniture placed"}

## RENDERING REQUIREMENTS
1. View angle: Top-down isometric at ~60° from horizontal, camera positioned above center
2. Show the EXACT room layout as described with accurate relative positions
3. Rooms should be positioned according to the coordinates given (in feet)
4. Include all walls between rooms with appropriate thickness (4-6 inches)
5. Show doors as openings in walls at specified positions
6. Show windows on exterior walls at specified positions
7. Place furniture items at their specified coordinates within rooms
8. Apply the style/vibe specified for each room (different flooring, wall colors)
9. Render with realistic overhead lighting (midday sun from above)
10. Include soft shadows for depth perception
11. Remove roof/ceiling to show interior layout
12. Professional architectural rendering quality
13. Maintain accurate scale - 1 foot = consistent visual size across entire render
14. Clear visual distinction between different room types`
}

/**
 * Build FIRST-PERSON render prompt with spatial awareness
 */
export function buildFirstPersonPrompt(
  blueprint: BlueprintData,
  finish: Finish,
  camera: CameraPlacement
): string {
  const roomFinishes = (finish.roomFinishes || []) as RoomFinish[]
  const globalTier = finish.globalTier || "standard"

  const aduOrigin = calculateAduOrigin(blueprint.aduBoundary, blueprint.pixelsPerFoot)
  const spatialRooms = processRooms(blueprint.rooms, blueprint.pixelsPerFoot, aduOrigin)
  const spatialFurniture = processFurniture(blueprint.furniture, spatialRooms, blueprint.pixelsPerFoot, aduOrigin)

  // Camera position in feet
  const cameraX = pixelsToFeet(camera.position.x, blueprint.pixelsPerFoot) - aduOrigin.x
  const cameraY = pixelsToFeet(camera.position.y, blueprint.pixelsPerFoot) - aduOrigin.y

  // Find which room the camera is in
  const cameraRoom = findRoomForPoint({ x: cameraX, y: cameraY }, spatialRooms)
  const cameraRoomFinish = cameraRoom
    ? roomFinishes.find(rf => rf.roomId === cameraRoom.id)
    : null

  // Calculate what's visible based on camera direction
  const cameraRotation = camera.rotation
  const halfFov = camera.fov / 2

  // Find visible furniture
  const visibleFurniture = spatialFurniture.filter(item => {
    const dx = item.x - cameraX
    const dy = item.y - cameraY
    const distance = Math.sqrt(dx * dx + dy * dy)
    if (distance > 25) return false // More than 25 feet away

    const angleToItem = Math.atan2(dy, dx) * (180 / Math.PI)
    let angleDiff = angleToItem - cameraRotation
    while (angleDiff > 180) angleDiff -= 360
    while (angleDiff < -180) angleDiff += 360

    return Math.abs(angleDiff) <= halfFov + 20 // Some margin
  })

  // Direction description
  const directions = ["east", "southeast", "south", "southwest", "west", "northwest", "north", "northeast"]
  const directionIndex = Math.round(cameraRotation / 45) % 8
  const facingDirection = directions[directionIndex]

  const vibeDesc = cameraRoomFinish
    ? getVibeDescription(cameraRoomFinish.vibe as Vibe)
    : "modern minimal style"

  const furnitureList = visibleFurniture.map(item => {
    const dx = item.x - cameraX
    const dy = item.y - cameraY
    const distance = Math.sqrt(dx * dx + dy * dy)
    return `  - ${item.name} approximately ${Math.round(distance)}' away`
  }).join("\n")

  return `Generate a first-person interior photograph of an ADU (Accessory Dwelling Unit), as if standing inside the space.

## CAMERA POSITION
Location: Standing in ${cameraRoom?.name || "the space"} at position (${Math.round(cameraX)}', ${Math.round(cameraY)}')
Eye height: ${camera.height}' (${camera.height < 5 ? "low angle" : camera.height > 6 ? "standing tall" : "normal eye level"})
Facing: ${facingDirection} (${cameraRotation}°)
Field of view: ${camera.fov}° (${camera.fov <= 30 ? "narrow/telephoto" : camera.fov >= 90 ? "wide angle" : "normal lens"})

## CURRENT ROOM
${cameraRoom ? `${cameraRoom.name} (${cameraRoom.type})
Size: ${cameraRoom.width}' × ${cameraRoom.height}' (${cameraRoom.areaSqFt} sq ft)
Style: ${vibeDesc}
Quality: ${cameraRoomFinish ? getTierDescription(cameraRoomFinish.tier) : getTierDescription(globalTier)}` : "Open area"}

## VISIBLE FURNITURE
${furnitureList || "  No furniture in view"}

## RENDERING REQUIREMENTS
1. First-person perspective as if standing inside at the specified position
2. Professional real estate photography style
3. Natural lighting through windows, realistic interior illumination
4. Show accurate room proportions based on dimensions given
5. Furniture positioned at correct distances from camera
6. Wall colors, flooring, and finishes matching the specified style
7. ${camera.fov >= 90 ? "Wide-angle lens effect with slight barrel distortion at edges" : "Natural perspective without distortion"}
8. Realistic material textures (wood grain, fabric, tile, etc.)
9. Appropriate ceiling height (8-9 feet standard)
10. Photorealistic quality suitable for real estate marketing`
}

/**
 * Build a simple test prompt for debugging
 */
export function buildTestPrompt(): string {
  return `A beautiful modern minimalist living room interior. Professional real estate photography style. Natural lighting, neutral colors, contemporary furniture. High quality architectural visualization.`
}
