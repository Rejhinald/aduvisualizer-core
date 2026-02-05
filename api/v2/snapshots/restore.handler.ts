import { Context } from "hono"
import { db } from "../../../config/db"
import { snapshots, blueprints, corners, walls, doors, windows, furniture, lots } from "../../../schema"
import { eq } from "drizzle-orm"
import { successResponse, failedResponse } from "../../../utils/response/helpers"

interface SnapshotData {
  corners: Array<{ id: string; x: number; y: number; elevation: number }>
  walls: Array<{ id: string; startCornerId: string; endCornerId: string; thickness: number; height: number }>
  doors: Array<{ id: string; wallId: string; position: number; type: string; width: number; height: number }>
  windows: Array<{ id: string; wallId: string; position: number; type: string; width: number; height: number; sillHeight: number }>
  furniture: Array<{ id: string; type: string; x: number; y: number; rotation: number; width: number; depth: number }>
  lot: { id: string; address?: string; city?: string; state?: string; zipCode?: string; geoLat?: number; geoLng?: number; boundary?: Array<{ x: number; y: number }>; setbacks?: { front: number; back: number; left: number; right: number }; source?: string } | null
  blueprintVersion: number
}

/**
 * POST /api/v2/snapshots/:snapshotId/restore
 * Restore blueprint from a snapshot
 */
export async function restoreSnapshotHandler(c: Context) {
  try {
    const snapshotId = c.req.param("snapshotId")
    if (!snapshotId) {
      return c.json(failedResponse(c, { message: "Snapshot ID is required" }), 400)
    }

    // Get snapshot
    const [snapshot] = await db
      .select()
      .from(snapshots)
      .where(eq(snapshots.id, snapshotId))
      .limit(1)

    if (!snapshot) {
      return c.json(failedResponse(c, { message: "Snapshot not found" }), 404)
    }

    const data = snapshot.data as SnapshotData
    const blueprintId = snapshot.blueprintId

    // Restore in transaction
    await db.transaction(async (tx) => {
      // Clear current state
      await tx.delete(corners).where(eq(corners.blueprintId, blueprintId))
      await tx.delete(walls).where(eq(walls.blueprintId, blueprintId))
      await tx.delete(furniture).where(eq(furniture.blueprintId, blueprintId))
      await tx.delete(lots).where(eq(lots.blueprintId, blueprintId))

      // Create ID maps for corners and walls
      const cornerMap = new Map<string, string>()
      const wallMap = new Map<string, string>()

      // Insert corners
      if (data.corners.length > 0) {
        const insertedCorners = await tx
          .insert(corners)
          .values(data.corners.map((c) => ({
            blueprintId,
            x: c.x,
            y: c.y,
            elevation: c.elevation,
          })))
          .returning()

        data.corners.forEach((oldCorner, i) => {
          cornerMap.set(oldCorner.id, insertedCorners[i].id)
        })
      }

      // Insert walls (with mapped corner IDs)
      if (data.walls.length > 0) {
        const insertedWalls = await tx
          .insert(walls)
          .values(data.walls.map((w) => ({
            blueprintId,
            startCornerId: cornerMap.get(w.startCornerId) ?? w.startCornerId,
            endCornerId: cornerMap.get(w.endCornerId) ?? w.endCornerId,
            thickness: w.thickness,
            height: w.height,
          })))
          .returning()

        data.walls.forEach((oldWall, i) => {
          wallMap.set(oldWall.id, insertedWalls[i].id)
        })
      }

      // Insert doors (with mapped wall IDs)
      if (data.doors.length > 0) {
        await tx.insert(doors).values(
          data.doors.map((d) => ({
            wallId: wallMap.get(d.wallId) ?? d.wallId,
            position: d.position,
            type: d.type,
            width: d.width,
            height: d.height,
          }))
        )
      }

      // Insert windows (with mapped wall IDs)
      if (data.windows.length > 0) {
        await tx.insert(windows).values(
          data.windows.map((w) => ({
            wallId: wallMap.get(w.wallId) ?? w.wallId,
            position: w.position,
            type: w.type,
            width: w.width,
            height: w.height,
            sillHeight: w.sillHeight,
          }))
        )
      }

      // Insert furniture
      if (data.furniture.length > 0) {
        await tx.insert(furniture).values(
          data.furniture.map((f) => ({
            blueprintId,
            type: f.type,
            x: f.x,
            y: f.y,
            rotation: f.rotation,
            width: f.width,
            depth: f.depth,
          }))
        )
      }

      // Insert lot
      if (data.lot) {
        await tx.insert(lots).values({
          blueprintId,
          address: data.lot.address,
          city: data.lot.city,
          state: data.lot.state,
          zipCode: data.lot.zipCode,
          geoLat: data.lot.geoLat,
          geoLng: data.lot.geoLng,
          boundary: data.lot.boundary,
          setbacks: data.lot.setbacks,
          source: data.lot.source,
        })
      }

      // Update blueprint version
      await tx
        .update(blueprints)
        .set({
          version: data.blueprintVersion,
          updatedAt: new Date(),
        })
        .where(eq(blueprints.id, blueprintId))
    })

    return c.json(successResponse(c, { data: { snapshotId, blueprintId }, message: "Blueprint restored from snapshot" }))
  } catch (error) {
    console.error("Error restoring snapshot:", error)
    return c.json(failedResponse(c, { message: "Failed to restore snapshot" }), 500)
  }
}
