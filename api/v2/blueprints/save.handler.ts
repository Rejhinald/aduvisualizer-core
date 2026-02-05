import { Context } from "hono"
import { db } from "../../../config/db"
import { blueprints, corners, walls, doors, windows, furniture, projects, boundaryCorners, boundaryWalls } from "../../../schema"
import { eq } from "drizzle-orm"
import { SaveBlueprintSchemaV2 } from "../../../types/blueprint-v2"
import { detectRooms, suggestRoomType, getFurnitureInRoom } from "../../../service/blueprint-engine"
import { successResponse, failedResponse, formatZodErrors } from "../../../utils/response/helpers"

/**
 * POST /api/v2/blueprints/save
 * Save complete blueprint (corners, walls, doors, windows, furniture)
 * Returns blueprint with computed rooms
 */
export async function saveBlueprintHandler(c: Context) {
  try {
    const body = await c.req.json()
    const parsed = SaveBlueprintSchemaV2.safeParse(body)

    if (!parsed.success) {
      return c.json(failedResponse(c, { message: "Invalid blueprint data", error: formatZodErrors(parsed.error) }), 400)
    }

    const data = parsed.data

    // Use transaction for atomicity
    const result = await db.transaction(async (tx) => {
      // 0. Ensure project exists (auto-create if not)
      const existingProject = await tx
        .select()
        .from(projects)
        .where(eq(projects.id, data.projectId))
        .limit(1)
        .then((rows) => rows[0])

      if (!existingProject) {
        await tx.insert(projects).values({
          id: data.projectId,
          name: data.name ?? "Untitled Project",
        })
      }

      // 1. Create or update blueprint
      let blueprint = await tx
        .select()
        .from(blueprints)
        .where(eq(blueprints.projectId, data.projectId))
        .limit(1)
        .then((rows) => rows[0])

      if (blueprint) {
        // Update existing
        ;[blueprint] = await tx
          .update(blueprints)
          .set({
            name: data.name ?? blueprint.name,
            version: blueprint.version + 1,
            updatedAt: new Date(),
          })
          .where(eq(blueprints.id, blueprint.id))
          .returning()
      } else {
        // Create new
        ;[blueprint] = await tx
          .insert(blueprints)
          .values({
            projectId: data.projectId,
            name: data.name ?? "Untitled",
          })
          .returning()
      }

      // 2. Clear existing elements
      await tx.delete(corners).where(eq(corners.blueprintId, blueprint.id))
      await tx.delete(walls).where(eq(walls.blueprintId, blueprint.id))
      await tx.delete(furniture).where(eq(furniture.blueprintId, blueprint.id))
      await tx.delete(boundaryCorners).where(eq(boundaryCorners.blueprintId, blueprint.id))
      await tx.delete(boundaryWalls).where(eq(boundaryWalls.blueprintId, blueprint.id))

      // 3. Insert corners
      const cornerMap = new Map<string, string>() // old id -> new id
      if (data.corners.length > 0) {
        const insertedCorners = await tx
          .insert(corners)
          .values(
            data.corners.map((c) => ({
              blueprintId: blueprint.id,
              x: c.x,
              y: c.y,
              elevation: c.elevation ?? 0,
            }))
          )
          .returning()

        // Always map the original corner ID (temp or otherwise) to the new database ID
        // This ensures walls can find the correct UUID even when corners had temp IDs
        data.corners.forEach((oldCorner, i) => {
          cornerMap.set(oldCorner.id, insertedCorners[i].id)
        })
      }

      // 4. Insert walls (with mapped corner IDs)
      const wallMap = new Map<string, string>()
      if (data.walls.length > 0) {
        const insertedWalls = await tx
          .insert(walls)
          .values(
            data.walls.map((w) => ({
              blueprintId: blueprint.id,
              startCornerId: cornerMap.get(w.startCornerId) ?? w.startCornerId,
              endCornerId: cornerMap.get(w.endCornerId) ?? w.endCornerId,
              thickness: w.thickness ?? 0.5,
              height: w.height ?? 9,
              wallType: w.wallType ?? "solid",
            }))
          )
          .returning()

        data.walls.forEach((oldWall, i) => {
          if (oldWall.id) {
            wallMap.set(oldWall.id, insertedWalls[i].id)
          }
        })
      }

      // 5. Insert doors
      if (data.doors.length > 0) {
        await tx.insert(doors).values(
          data.doors.map((d) => ({
            wallId: wallMap.get(d.wallId) ?? d.wallId,
            position: d.position,
            type: d.type ?? "single",
            width: d.width ?? 3,
            height: d.height ?? 6.67,
            orientation: d.orientation ?? 0,
          }))
        )
      }

      // 6. Insert windows
      if (data.windows.length > 0) {
        await tx.insert(windows).values(
          data.windows.map((w) => ({
            wallId: wallMap.get(w.wallId) ?? w.wallId,
            position: w.position,
            type: w.type ?? "standard",
            width: w.width ?? 3,
            height: w.height ?? 4,
            sillHeight: w.sillHeight ?? 3,
          }))
        )
      }

      // 7. Insert furniture
      if (data.furniture.length > 0) {
        await tx.insert(furniture).values(
          data.furniture.map((f) => ({
            blueprintId: blueprint.id,
            type: f.type,
            x: f.x,
            y: f.y,
            rotation: f.rotation ?? 0,
            width: f.width,
            depth: f.depth,
          }))
        )
      }

      // 8. Insert boundary corners (for ADU boundary shape)
      const boundaryCornerMap = new Map<string, string>() // old id -> new id
      if (data.boundaryCorners && data.boundaryCorners.length > 0) {
        const insertedBoundaryCorners = await tx
          .insert(boundaryCorners)
          .values(
            data.boundaryCorners.map((c) => ({
              blueprintId: blueprint.id,
              x: c.x,
              y: c.y,
              orderIndex: c.orderIndex ?? 0,
            }))
          )
          .returning()

        data.boundaryCorners.forEach((oldCorner, i) => {
          if (oldCorner.id) {
            boundaryCornerMap.set(oldCorner.id, insertedBoundaryCorners[i].id)
          }
        })
      }

      // 9. Insert boundary walls (with mapped boundary corner IDs)
      if (data.boundaryWalls && data.boundaryWalls.length > 0) {
        await tx.insert(boundaryWalls).values(
          data.boundaryWalls.map((w) => ({
            blueprintId: blueprint.id,
            startCornerId: boundaryCornerMap.get(w.startCornerId) ?? w.startCornerId,
            endCornerId: boundaryCornerMap.get(w.endCornerId) ?? w.endCornerId,
          }))
        )
      }

      return blueprint
    })

    // 10. Fetch complete data and compute rooms
    const [savedCorners, savedWalls, savedDoors, savedWindows, savedFurniture, savedBoundaryCorners, savedBoundaryWalls] = await Promise.all([
      db.select().from(corners).where(eq(corners.blueprintId, result.id)),
      db.select().from(walls).where(eq(walls.blueprintId, result.id)),
      db.select().from(doors),
      db.select().from(windows),
      db.select().from(furniture).where(eq(furniture.blueprintId, result.id)),
      db.select().from(boundaryCorners).where(eq(boundaryCorners.blueprintId, result.id)),
      db.select().from(boundaryWalls).where(eq(boundaryWalls.blueprintId, result.id)),
    ])

    // Filter doors/windows to only those on our walls
    const wallIds = new Set(savedWalls.map((w) => w.id))
    const filteredDoors = savedDoors.filter((d) => wallIds.has(d.wallId))
    const filteredWindows = savedWindows.filter((w) => wallIds.has(w.wallId))

    // 11. Detect rooms from wall graph
    const computedRooms = detectRooms(savedCorners, savedWalls)

    // 12. Auto-suggest room types based on furniture
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
          id: result.id,
          projectId: result.projectId,
          name: result.name,
          version: result.version,
          corners: savedCorners,
          walls: savedWalls,
          doors: filteredDoors,
          windows: filteredWindows,
          furniture: savedFurniture,
          boundaryCorners: savedBoundaryCorners,
          boundaryWalls: savedBoundaryWalls,
          rooms: roomsWithTypes,
          createdAt: result.createdAt.toISOString(),
          updatedAt: result.updatedAt.toISOString(),
        },
        message: "Blueprint saved",
      }),
      201
    )
  } catch (error) {
    console.error("Error saving blueprint:", error)
    return c.json(failedResponse(c, { message: "Failed to save blueprint" }), 500)
  }
}
