/**
 * Room Detection Algorithm
 * Finds enclosed rooms from wall graph using cycle detection
 */

import type { Corner, Wall, RoomV2, Point, RoomTypeV2, FurnitureV2 } from "../../types/blueprint-v2"
import { polygonArea, polygonCentroid, ensureCounterClockwise, angle, isPointInPolygon } from "./geometry"

/**
 * Generate a unique room ID
 */
function createRoomId(): string {
  return `r_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Find corner by ID
 */
function findCornerById(corners: Corner[], id: string): Corner | undefined {
  return corners.find((c) => c.id === id)
}

/**
 * Check if wall exists between two corners
 */
function wallExists(walls: Wall[], corner1Id: string, corner2Id: string): Wall | undefined {
  return walls.find(
    (w) =>
      (w.startCornerId === corner1Id && w.endCornerId === corner2Id) ||
      (w.startCornerId === corner2Id && w.endCornerId === corner1Id)
  )
}

/**
 * Detect all enclosed rooms from walls
 */
export function detectRooms(corners: Corner[], walls: Wall[]): RoomV2[] {
  if (corners.length < 3 || walls.length < 3) {
    return []
  }

  // Build adjacency map
  const adjacencyMap = buildAdjacencyMap(corners, walls)

  // Find all minimal cycles
  const cycles = findAllMinimalCycles(corners, walls, adjacencyMap)

  // Convert cycles to rooms
  const rooms: RoomV2[] = []
  const usedCycleKeys = new Set<string>()

  for (const cycle of cycles) {
    const cycleKey = createCycleKey(cycle)
    if (usedCycleKeys.has(cycleKey)) continue
    usedCycleKeys.add(cycleKey)

    // Get corners for this cycle
    const roomCorners = cycle
      .map((id) => findCornerById(corners, id))
      .filter((c): c is Corner => c !== undefined)

    if (roomCorners.length < 3) continue

    // Ensure counter-clockwise winding
    const orderedCorners = ensureCounterClockwise(roomCorners)

    // Get walls that form this room
    const roomWalls = getWallsForCycle(cycle, walls)

    // Calculate area and center
    const area = polygonArea(orderedCorners)
    const center = polygonCentroid(orderedCorners)

    // Skip very small areas
    if (area < 1) continue

    rooms.push({
      id: createRoomId(),
      corners: orderedCorners,
      walls: roomWalls,
      area,
      center,
      name: `Room ${rooms.length + 1}`,
      type: "other",
    })
  }

  return rooms
}

/**
 * Build adjacency map from walls
 */
function buildAdjacencyMap(
  corners: Corner[],
  walls: Wall[]
): Map<string, Array<{ cornerId: string; wall: Wall }>> {
  const map = new Map<string, Array<{ cornerId: string; wall: Wall }>>()

  for (const corner of corners) {
    if (corner.id) {
      map.set(corner.id, [])
    }
  }

  for (const wall of walls) {
    const startList = map.get(wall.startCornerId)
    const endList = map.get(wall.endCornerId)

    if (startList) {
      startList.push({ cornerId: wall.endCornerId, wall })
    }
    if (endList) {
      endList.push({ cornerId: wall.startCornerId, wall })
    }
  }

  return map
}

/**
 * Find all minimal cycles
 */
function findAllMinimalCycles(
  corners: Corner[],
  walls: Wall[],
  adjacencyMap: Map<string, Array<{ cornerId: string; wall: Wall }>>
): string[][] {
  const cycles: string[][] = []
  const visitedEdges = new Set<string>()

  for (const startCorner of corners) {
    if (!startCorner.id) continue

    const adjacent = adjacencyMap.get(startCorner.id) ?? []

    for (const { cornerId: firstNeighborId } of adjacent) {
      const edgeKey = makeEdgeKey(startCorner.id, firstNeighborId)

      if (visitedEdges.has(edgeKey)) continue

      const cycle = traceCycle(
        startCorner.id,
        firstNeighborId,
        corners,
        adjacencyMap,
        visitedEdges
      )

      if (cycle && cycle.length >= 3) {
        cycles.push(cycle)
      }
    }
  }

  return cycles
}

/**
 * Trace a cycle by always turning clockwise
 */
function traceCycle(
  startId: string,
  firstNeighborId: string,
  corners: Corner[],
  adjacencyMap: Map<string, Array<{ cornerId: string; wall: Wall }>>,
  visitedEdges: Set<string>
): string[] | null {
  const MAX_CYCLE_LENGTH = 50
  const cycle: string[] = [startId]

  let prevId = startId
  let currentId = firstNeighborId

  while (cycle.length < MAX_CYCLE_LENGTH) {
    const edgeKey = makeEdgeKey(prevId, currentId)
    visitedEdges.add(edgeKey)

    cycle.push(currentId)

    if (currentId === startId) {
      cycle.pop()
      return cycle
    }

    const nextId = findNextCornerClockwise(prevId, currentId, corners, adjacencyMap)

    if (!nextId) {
      return null
    }

    prevId = currentId
    currentId = nextId
  }

  return null
}

/**
 * Find the next corner by turning clockwise
 */
function findNextCornerClockwise(
  prevId: string,
  currentId: string,
  corners: Corner[],
  adjacencyMap: Map<string, Array<{ cornerId: string; wall: Wall }>>
): string | null {
  const prevCorner = findCornerById(corners, prevId)
  const currentCorner = findCornerById(corners, currentId)
  if (!prevCorner || !currentCorner) return null

  const adjacent = adjacencyMap.get(currentId) ?? []
  if (adjacent.length === 0) return null

  const incomingAngle = angle(prevCorner, currentCorner)

  let bestNext: string | null = null
  let bestAngle = Infinity

  for (const { cornerId: nextId } of adjacent) {
    if (nextId === prevId) continue

    const nextCorner = findCornerById(corners, nextId)
    if (!nextCorner) continue

    const outgoingAngle = angle(currentCorner, nextCorner)

    let turnAngle = outgoingAngle - incomingAngle
    if (turnAngle < 0) turnAngle += 2 * Math.PI
    if (turnAngle >= 2 * Math.PI) turnAngle -= 2 * Math.PI

    if (turnAngle < bestAngle) {
      bestAngle = turnAngle
      bestNext = nextId
    }
  }

  return bestNext
}

/**
 * Create edge key (consistent ordering)
 */
function makeEdgeKey(id1: string, id2: string): string {
  return id1 < id2 ? `${id1}|${id2}` : `${id2}|${id1}`
}

/**
 * Create cycle key for deduplication
 */
function createCycleKey(cycle: string[]): string {
  if (cycle.length === 0) return ""

  let minRotation = cycle.join("|")

  for (let i = 1; i < cycle.length; i++) {
    const rotation = [...cycle.slice(i), ...cycle.slice(0, i)].join("|")
    if (rotation < minRotation) {
      minRotation = rotation
    }
  }

  const reversed = [...cycle].reverse()
  for (let i = 0; i < reversed.length; i++) {
    const rotation = [...reversed.slice(i), ...reversed.slice(0, i)].join("|")
    if (rotation < minRotation) {
      minRotation = rotation
    }
  }

  return minRotation
}

/**
 * Get walls that form a cycle
 */
function getWallsForCycle(cycle: string[], walls: Wall[]): Wall[] {
  const cycleWalls: Wall[] = []

  for (let i = 0; i < cycle.length; i++) {
    const j = (i + 1) % cycle.length
    const wall = wallExists(walls, cycle[i], cycle[j])
    if (wall) {
      cycleWalls.push(wall)
    }
  }

  return cycleWalls
}

/**
 * Check if a point is inside a room
 */
export function isPointInRoom(point: Point, room: RoomV2): boolean {
  return isPointInPolygon(point, room.corners)
}

/**
 * Find room containing a point
 */
export function findRoomAtPoint(rooms: RoomV2[], point: Point): RoomV2 | null {
  for (const room of rooms) {
    if (isPointInRoom(point, room)) {
      return room
    }
  }
  return null
}

/**
 * Suggest room type based on area and furniture
 */
export function suggestRoomType(room: RoomV2, furnitureInRoom: FurnitureV2[]): RoomTypeV2 {
  const area = room.area
  const furnitureTypes = new Set(furnitureInRoom.map((f) => f.type))

  // Check for specific furniture that identifies room type
  if (furnitureTypes.has("toilet")) {
    if (area < 45 && !furnitureTypes.has("shower") && !furnitureTypes.has("bathtub")) {
      return "half_bath"
    }
    return "bathroom"
  }

  if (furnitureTypes.has("stove") || furnitureTypes.has("refrigerator") || furnitureTypes.has("kitchen_sink")) {
    return "kitchen"
  }

  if (furnitureTypes.has("bed_queen") || furnitureTypes.has("bed_king") || furnitureTypes.has("bed_twin")) {
    return "bedroom"
  }

  if (furnitureTypes.has("dining_table")) {
    return "dining"
  }

  if (furnitureTypes.has("sofa_3seat") || furnitureTypes.has("sofa_2seat")) {
    return "living"
  }

  // Fall back to area-based suggestion
  if (area < 30) return "closet"
  if (area < 50) return "storage"
  if (area > 150) return "living"

  return "flex"
}

/**
 * Get furniture that is inside a room
 */
export function getFurnitureInRoom(room: RoomV2, allFurniture: FurnitureV2[]): FurnitureV2[] {
  return allFurniture.filter((f) => isPointInRoom({ x: f.x, y: f.y }, room))
}
