import { Context } from "hono"
import { db } from "../../../config/db"
import { blueprints, corners, walls, doors, windows, furniture, lots, boundaryCorners, boundaryWalls } from "../../../schema"
import { eq } from "drizzle-orm"
import { detectRooms, suggestRoomType, getFurnitureInRoom } from "../../../service/blueprint-engine"
import { successResponse, failedResponse } from "../../../utils/response/helpers"

/**
 * GET /api/v2/blueprints/:blueprintId
 * Get a blueprint with all elements and computed rooms
 */
export async function getBlueprintHandler(c: Context) {
  try {
    const blueprintId = c.req.param("blueprintId")
    if (!blueprintId) {
      return c.json(failedResponse(c, { message: "Blueprint ID is required" }), 400)
    }

    // Fetch blueprint
    const [blueprint] = await db
      .select()
      .from(blueprints)
      .where(eq(blueprints.id, blueprintId))
      .limit(1)

    if (!blueprint) {
      return c.json(failedResponse(c, { message: "Blueprint not found" }), 404)
    }

    // Fetch all elements in parallel
    const [
      savedCorners,
      savedWalls,
      savedDoors,
      savedWindows,
      savedFurniture,
      savedLot,
      savedBoundaryCorners,
      savedBoundaryWalls,
    ] = await Promise.all([
      db.select().from(corners).where(eq(corners.blueprintId, blueprintId)),
      db.select().from(walls).where(eq(walls.blueprintId, blueprintId)),
      db.select().from(doors),
      db.select().from(windows),
      db.select().from(furniture).where(eq(furniture.blueprintId, blueprintId)),
      db
        .select()
        .from(lots)
        .where(eq(lots.blueprintId, blueprintId))
        .limit(1)
        .then((rows) => rows[0] ?? null),
      db.select().from(boundaryCorners).where(eq(boundaryCorners.blueprintId, blueprintId)),
      db.select().from(boundaryWalls).where(eq(boundaryWalls.blueprintId, blueprintId)),
    ])

    // Filter doors/windows to only those on our walls
    const wallIds = new Set(savedWalls.map((w) => w.id))
    const filteredDoors = savedDoors.filter((d) => wallIds.has(d.wallId))
    const filteredWindows = savedWindows.filter((w) => wallIds.has(w.wallId))

    // Detect rooms from wall graph
    const computedRooms = detectRooms(savedCorners, savedWalls)

    // Auto-suggest room types based on furniture
    const roomsWithTypes = computedRooms.map((room) => {
      const furnitureInRoom = getFurnitureInRoom(room, savedFurniture as any)
      const suggestedType = suggestRoomType(room, furnitureInRoom as any)
      return {
        ...room,
        type: suggestedType,
      }
    })

    return c.json(
      successResponse(c, {
        data: {
          id: blueprint.id,
          projectId: blueprint.projectId,
          name: blueprint.name,
          version: blueprint.version,
          corners: savedCorners,
          walls: savedWalls,
          doors: filteredDoors,
          windows: filteredWindows,
          furniture: savedFurniture,
          boundaryCorners: savedBoundaryCorners,
          boundaryWalls: savedBoundaryWalls,
          rooms: roomsWithTypes,
          lot: savedLot,
          createdAt: blueprint.createdAt.toISOString(),
          updatedAt: blueprint.updatedAt.toISOString(),
        },
        message: "Blueprint retrieved",
      })
    )
  } catch (error) {
    console.error("Error getting blueprint:", error)
    return c.json(failedResponse(c, { message: "Failed to get blueprint" }), 500)
  }
}

/**
 * GET /api/v2/blueprints/project/:projectId
 * Get blueprint for a project
 */
export async function getBlueprintByProjectHandler(c: Context) {
  try {
    const projectId = c.req.param("projectId")
    if (!projectId) {
      return c.json(failedResponse(c, { message: "Project ID is required" }), 400)
    }

    // Find blueprint for this project
    const [blueprint] = await db
      .select()
      .from(blueprints)
      .where(eq(blueprints.projectId, projectId))
      .limit(1)

    if (!blueprint) {
      return c.json(successResponse(c, { data: null, message: "No blueprint found for project" }))
    }

    // Fetch the full blueprint data
    const [
      savedCorners,
      savedWalls,
      savedDoors,
      savedWindows,
      savedFurniture,
      savedLot,
      savedBoundaryCorners,
      savedBoundaryWalls,
    ] = await Promise.all([
      db.select().from(corners).where(eq(corners.blueprintId, blueprint.id)),
      db.select().from(walls).where(eq(walls.blueprintId, blueprint.id)),
      db.select().from(doors),
      db.select().from(windows),
      db.select().from(furniture).where(eq(furniture.blueprintId, blueprint.id)),
      db
        .select()
        .from(lots)
        .where(eq(lots.blueprintId, blueprint.id))
        .limit(1)
        .then((rows) => rows[0] ?? null),
      db.select().from(boundaryCorners).where(eq(boundaryCorners.blueprintId, blueprint.id)),
      db.select().from(boundaryWalls).where(eq(boundaryWalls.blueprintId, blueprint.id)),
    ])

    // Filter doors/windows to only those on our walls
    const wallIds = new Set(savedWalls.map((w) => w.id))
    const filteredDoors = savedDoors.filter((d) => wallIds.has(d.wallId))
    const filteredWindows = savedWindows.filter((w) => wallIds.has(w.wallId))

    // Detect rooms from wall graph
    const computedRooms = detectRooms(savedCorners, savedWalls)

    // Auto-suggest room types based on furniture
    const roomsWithTypes = computedRooms.map((room) => {
      const furnitureInRoom = getFurnitureInRoom(room, savedFurniture as any)
      const suggestedType = suggestRoomType(room, furnitureInRoom as any)
      return {
        ...room,
        type: suggestedType,
      }
    })

    return c.json(
      successResponse(c, {
        data: {
          id: blueprint.id,
          projectId: blueprint.projectId,
          name: blueprint.name,
          version: blueprint.version,
          corners: savedCorners,
          walls: savedWalls,
          doors: filteredDoors,
          windows: filteredWindows,
          furniture: savedFurniture,
          boundaryCorners: savedBoundaryCorners,
          boundaryWalls: savedBoundaryWalls,
          rooms: roomsWithTypes,
          lot: savedLot,
          createdAt: blueprint.createdAt.toISOString(),
          updatedAt: blueprint.updatedAt.toISOString(),
        },
        message: "Blueprint retrieved",
      })
    )
  } catch (error) {
    console.error("Error getting blueprint by project:", error)
    return c.json(failedResponse(c, { message: "Failed to get blueprint" }), 500)
  }
}
