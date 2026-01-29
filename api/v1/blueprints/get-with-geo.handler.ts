import type { Context } from "hono"
import { db } from "../../../config/db"
import { blueprints, rooms, doors, windows, furniture, projects } from "../../../schema"
import { eq, and } from "drizzle-orm"
import { successResponse, failedResponse } from "../../../utils/response/helpers"
import {
  canvasToLatLng,
  pixelsToFeet,
  calculateGeoBounds,
} from "../../../utils/geo/coordinate-converter"

/**
 * Get blueprint with all coordinates converted to geographic coordinates
 * This is used for overlaying the blueprint on satellite imagery
 */
export async function getBlueprintWithGeoHandler(c: Context) {
  try {
    const id = c.req.param("id")

    // Get blueprint
    const [blueprint] = await db
      .select()
      .from(blueprints)
      .where(and(eq(blueprints.id, id), eq(blueprints.isDeleted, false)))
      .limit(1)

    if (!blueprint) {
      return c.json(
        failedResponse(c, { message: "Blueprint not found" }),
        404
      )
    }

    // Get project for geo reference
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, blueprint.projectId))
      .limit(1)

    if (!project) {
      return c.json(
        failedResponse(c, { message: "Project not found" }),
        404
      )
    }

    // Check if geo location is set
    if (!project.geoLat || !project.geoLng) {
      return c.json(
        failedResponse(c, {
          message: "Geo-location not set for this project. Use POST /projects/:id/geo-location first.",
        }),
        400
      )
    }

    // Geo conversion config
    const geoConfig = {
      centerLat: project.geoLat,
      centerLng: project.geoLng,
      pixelsPerFoot: blueprint.pixelsPerFoot ?? 100,
      canvasWidth: blueprint.canvasWidth ?? 800,
      canvasHeight: blueprint.canvasHeight ?? 800,
      rotationDeg: project.geoRotation ?? 0,
    }

    // Get all related data
    const [roomsData, doorsData, windowsData, furnitureData] = await Promise.all([
      db.select().from(rooms).where(and(eq(rooms.blueprintId, id), eq(rooms.isDeleted, false))),
      db.select().from(doors).where(and(eq(doors.blueprintId, id), eq(doors.isDeleted, false))),
      db.select().from(windows).where(and(eq(windows.blueprintId, id), eq(windows.isDeleted, false))),
      db.select().from(furniture).where(and(eq(furniture.blueprintId, id), eq(furniture.isDeleted, false))),
    ])

    // Convert ADU boundary to geo coordinates
    const aduBoundaryGeo = (blueprint.aduBoundary as Array<{ x: number; y: number }>)?.map(v =>
      canvasToLatLng(v.x, v.y, geoConfig)
    ) ?? []

    // Calculate overall bounds
    const aduGeoBounds = blueprint.aduBoundary
      ? calculateGeoBounds(blueprint.aduBoundary as Array<{ x: number; y: number }>, geoConfig)
      : null

    // Convert rooms to geo coordinates
    const roomsGeo = roomsData.map(room => {
      const vertices = room.vertices as Array<{ x: number; y: number }>
      const geoVertices = vertices.map(v => canvasToLatLng(v.x, v.y, geoConfig))
      const bounds = calculateGeoBounds(vertices, geoConfig)

      // Also convert to feet from center for AI prompting
      const centerX = geoConfig.canvasWidth / 2
      const centerY = geoConfig.canvasHeight / 2
      const verticesFeet = vertices.map(v => ({
        x: pixelsToFeet(v.x - centerX, geoConfig.pixelsPerFoot),
        y: pixelsToFeet(centerY - v.y, geoConfig.pixelsPerFoot),  // Flip Y
      }))

      return {
        ...room,
        // Original canvas coordinates
        verticesCanvas: vertices,
        // Feet from center (for AI)
        verticesFeet,
        // Geographic coordinates
        verticesGeo: geoVertices,
        bounds,
      }
    })

    // Convert doors to geo coordinates
    const doorsGeo = doorsData.map(door => {
      const geoPos = canvasToLatLng(door.x, door.y, geoConfig)
      const centerX = geoConfig.canvasWidth / 2
      const centerY = geoConfig.canvasHeight / 2

      return {
        ...door,
        positionCanvas: { x: door.x, y: door.y },
        positionFeet: {
          x: pixelsToFeet(door.x - centerX, geoConfig.pixelsPerFoot),
          y: pixelsToFeet(centerY - door.y, geoConfig.pixelsPerFoot),
        },
        positionGeo: geoPos,
      }
    })

    // Convert windows to geo coordinates
    const windowsGeo = windowsData.map(win => {
      const geoPos = canvasToLatLng(win.x, win.y, geoConfig)
      const centerX = geoConfig.canvasWidth / 2
      const centerY = geoConfig.canvasHeight / 2

      return {
        ...win,
        positionCanvas: { x: win.x, y: win.y },
        positionFeet: {
          x: pixelsToFeet(win.x - centerX, geoConfig.pixelsPerFoot),
          y: pixelsToFeet(centerY - win.y, geoConfig.pixelsPerFoot),
        },
        positionGeo: geoPos,
      }
    })

    // Convert furniture to geo coordinates
    const furnitureGeo = furnitureData.map(item => {
      const geoPos = canvasToLatLng(item.x, item.y, geoConfig)
      const centerX = geoConfig.canvasWidth / 2
      const centerY = geoConfig.canvasHeight / 2

      return {
        ...item,
        positionCanvas: { x: item.x, y: item.y },
        positionFeet: {
          x: pixelsToFeet(item.x - centerX, geoConfig.pixelsPerFoot),
          y: pixelsToFeet(centerY - item.y, geoConfig.pixelsPerFoot),
        },
        positionGeo: geoPos,
      }
    })

    return c.json(
      successResponse(c, {
        data: {
          blueprint: {
            ...blueprint,
            aduBoundaryGeo,
          },
          project: {
            id: project.id,
            name: project.name,
            geoLocation: {
              lat: project.geoLat,
              lng: project.geoLng,
              rotation: project.geoRotation,
            },
            address: {
              address: project.address,
              city: project.city,
              state: project.state,
              zipCode: project.zipCode,
            },
          },
          geoBounds: aduGeoBounds,
          rooms: roomsGeo,
          doors: doorsGeo,
          windows: windowsGeo,
          furniture: furnitureGeo,
          // Configuration for frontend
          geoConfig,
        },
        message: "Blueprint with geo-coordinates retrieved successfully",
      })
    )
  } catch (e) {
    console.error("Get blueprint with geo error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to get blueprint with geo-coordinates",
        error: { message: String(e) },
      }),
      500
    )
  }
}
