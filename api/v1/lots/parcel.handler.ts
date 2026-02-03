import type { Context } from "hono"
import { successResponse, failedResponse, formatZodErrors } from "../../../utils/response/helpers"
import { GetParcelSchema, type ParcelData } from "../../../types/lot"

/**
 * Fetch parcel data from Orange County GIS ArcGIS REST API
 *
 * API endpoint: https://gis.ocgov.com/arcgis/rest/services/
 *
 * Note: The exact endpoint may need adjustment based on the current
 * Orange County GIS service structure. Common service names include:
 * - Parcels/MapServer
 * - AssessorParcels/MapServer
 * - ParcelData/FeatureServer
 */

// Orange County GIS ArcGIS REST API endpoints
// Primary: OC Public Works ArcGIS Online (UXmFoWC7yDHcDN5Q org)
// Fallback: ocgis.com hosted services + city-specific services
const OC_GIS_ENDPOINTS = [
  // Laguna Niguel parcels (confirmed working, has polygon geometry)
  "https://services.arcgis.com/UXmFoWC7yDHcDN5Q/arcgis/rest/services/NLParcels_Feb2016_WGS1984/FeatureServer/0/query",
  // ocgis.com hosted parcel service (LegalLotsAttributeOpenData)
  "https://ocgis.com/arcpub/rest/services/LegalLotsAttributeOpenData/FeatureServer/0/query",
  "https://www.ocgis.com/arcpub/rest/services/LegalLotsAttributeOpenData/FeatureServer/0/query",
]

interface ArcGISQueryResponse {
  features?: Array<{
    attributes: {
      // APN/Parcel identifiers
      APN?: string
      PARCEL_NBR?: string
      ParcelNumber?: string
      LOTNUM?: string
      ASSESSMENT?: string
      // Address fields
      SitusAddress?: string
      SITUS_ADDR?: string
      SITE_ADDRE?: string
      SITE_STREE?: string
      SITE_CITY_?: string
      SITE_ZIP5?: string
      // Owner fields
      OwnerName?: string
      OWNER_NAME?: string
      OWNER_LAST?: string
      OWNER_FIRS?: string
      // Area/Size fields
      Shape_Area?: number
      SHAPE_Area?: number
      Shape__Area?: number
      SQFT_LOT?: number
      LOT_SIZE?: string
      LOT_WIDTH?: string
      LOT_DEPTH?: string
      Shape_Length?: number
      Shape__Length?: number
    }
    geometry?: {
      rings?: number[][][]
    }
  }>
  error?: {
    code: number
    message: string
    details?: string[]
  }
}

/**
 * Convert ArcGIS polygon rings to lat/lng vertices
 * ArcGIS returns coordinates as [lng, lat] (x, y)
 */
function convertRingsToVertices(rings: number[][][]): Array<{ lat: number; lng: number }> {
  if (!rings || rings.length === 0) return []

  // Use the first (outer) ring
  const outerRing = rings[0]

  return outerRing.map(([lng, lat]) => ({ lat, lng }))
}

/**
 * Calculate bounding box from vertices
 */
function calculateBounds(vertices: Array<{ lat: number; lng: number }>) {
  if (vertices.length === 0) return undefined

  let north = -90,
    south = 90,
    east = -180,
    west = 180

  for (const v of vertices) {
    if (v.lat > north) north = v.lat
    if (v.lat < south) south = v.lat
    if (v.lng > east) east = v.lng
    if (v.lng < west) west = v.lng
  }

  return { north, south, east, west }
}

export async function getParcelHandler(c: Context) {
  try {
    const lat = c.req.query("lat")
    const lng = c.req.query("lng")

    const parsed = GetParcelSchema.safeParse({
      lat: lat ? parseFloat(lat) : undefined,
      lng: lng ? parseFloat(lng) : undefined,
    })

    if (!parsed.success) {
      return c.json(
        failedResponse(c, {
          message: "Validation failed",
          error: formatZodErrors(parsed.error),
        }),
        400
      )
    }

    const { lat: latitude, lng: longitude } = parsed.data

    // Build ArcGIS query parameters
    const params = new URLSearchParams({
      f: "json",
      geometry: JSON.stringify({
        x: longitude,
        y: latitude,
        spatialReference: { wkid: 4326 },
      }),
      geometryType: "esriGeometryPoint",
      spatialRel: "esriSpatialRelIntersects",
      outFields: "*",
      returnGeometry: "true",
      outSR: "4326",
    })

    let parcelData: ParcelData | null = null
    let lastError: string | null = null

    // Try each endpoint until one works
    for (const endpoint of OC_GIS_ENDPOINTS) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

        const response = await fetch(`${endpoint}?${params}`, {
          headers: {
            Accept: "application/json",
          },
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          lastError = `HTTP ${response.status}: ${response.statusText}`
          continue
        }

        const data: ArcGISQueryResponse = await response.json()

        if (data.error) {
          lastError = data.error.message
          continue
        }

        if (data.features && data.features.length > 0) {
          const feature = data.features[0]
          const attrs = feature.attributes

          // Extract APN from various possible field names (prioritize ASSESSMENT over LOTNUM)
          const parcelNumber =
            attrs.APN || attrs.PARCEL_NBR || attrs.ParcelNumber || attrs.ASSESSMENT || attrs.LOTNUM || "Unknown"

          // Extract address (combine fields if needed)
          const situsAddress = attrs.SitusAddress || attrs.SITUS_ADDR || attrs.SITE_ADDRE ||
            (attrs.SITE_STREE ? `${attrs.SITE_STREE}, ${attrs.SITE_CITY_ || ""} ${attrs.SITE_ZIP5 || ""}`.trim() : undefined)

          // Extract owner name
          const ownerName = attrs.OwnerName || attrs.OWNER_NAME ||
            (attrs.OWNER_FIRS && attrs.OWNER_LAST ? `${attrs.OWNER_FIRS} ${attrs.OWNER_LAST}` : undefined)

          // Extract area (prioritize SQFT_LOT which is in actual sq ft, Shape__Area is in degrees)
          const areaSqFt = attrs.SQFT_LOT || attrs.Shape_Area || attrs.SHAPE_Area

          // Convert geometry to vertices
          const boundaryVertices = feature.geometry?.rings
            ? convertRingsToVertices(feature.geometry.rings)
            : []

          // Calculate bounds
          const bounds = calculateBounds(boundaryVertices)

          parcelData = {
            parcelNumber,
            situsAddress,
            ownerName,
            boundaryVertices,
            areaSqFt,
            bounds,
          }

          break // Found parcel, stop trying endpoints
        }
      } catch (endpointError) {
        const errorMsg = String(endpointError)
        if (errorMsg.includes("abort")) {
          lastError = `Timeout connecting to endpoint`
        } else {
          lastError = errorMsg
        }
        continue
      }
    }

    if (!parcelData) {
      return c.json(
        failedResponse(c, {
          message: "No parcel found at this location",
          error: lastError ? { details: lastError } : undefined,
        }),
        404
      )
    }

    return c.json(
      successResponse(c, {
        data: { parcel: parcelData },
        message: "Parcel data retrieved successfully",
      }),
      200
    )
  } catch (e) {
    console.error("Get parcel error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to fetch parcel data",
        error: { message: String(e) },
      }),
      500
    )
  }
}
