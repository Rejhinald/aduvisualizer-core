/**
 * Geo Coordinate Utilities
 *
 * Converts between:
 * - Canvas pixels (from the floor plan editor)
 * - Feet (real-world measurements)
 * - Lat/Lng (geographic coordinates for satellite overlay)
 */

// Earth's radius in feet (mean radius)
const EARTH_RADIUS_FEET = 20902231

// Degrees per foot at equator (approximately)
const DEG_PER_FOOT_LAT = 1 / 364000  // ~2.74e-6

/**
 * Calculate degrees per foot for longitude at a given latitude
 * Longitude degrees get smaller as you move away from equator
 */
export function degPerFootLng(lat: number): number {
  const latRad = (lat * Math.PI) / 180
  return DEG_PER_FOOT_LAT / Math.cos(latRad)
}

/**
 * Convert canvas pixels to feet
 */
export function pixelsToFeet(pixels: number, pixelsPerFoot: number): number {
  return pixels / pixelsPerFoot
}

/**
 * Convert feet to canvas pixels
 */
export function feetToPixels(feet: number, pixelsPerFoot: number): number {
  return feet * pixelsPerFoot
}

/**
 * Convert feet offset from a center point to lat/lng
 *
 * @param centerLat - Center point latitude
 * @param centerLng - Center point longitude
 * @param offsetXFeet - X offset in feet (positive = east)
 * @param offsetYFeet - Y offset in feet (positive = north)
 * @param rotationDeg - Rotation of the blueprint in degrees (0 = north up)
 */
export function feetToLatLng(
  centerLat: number,
  centerLng: number,
  offsetXFeet: number,
  offsetYFeet: number,
  rotationDeg: number = 0
): { lat: number; lng: number } {
  // Apply rotation if blueprint is rotated
  let rotatedX = offsetXFeet
  let rotatedY = offsetYFeet

  if (rotationDeg !== 0) {
    const rotRad = (rotationDeg * Math.PI) / 180
    rotatedX = offsetXFeet * Math.cos(rotRad) - offsetYFeet * Math.sin(rotRad)
    rotatedY = offsetXFeet * Math.sin(rotRad) + offsetYFeet * Math.cos(rotRad)
  }

  // Convert feet to degrees
  const latOffset = rotatedY * DEG_PER_FOOT_LAT
  const lngOffset = rotatedX * degPerFootLng(centerLat)

  return {
    lat: centerLat + latOffset,
    lng: centerLng + lngOffset,
  }
}

/**
 * Convert lat/lng to feet offset from a center point
 */
export function latLngToFeet(
  centerLat: number,
  centerLng: number,
  targetLat: number,
  targetLng: number,
  rotationDeg: number = 0
): { x: number; y: number } {
  // Convert degrees to feet
  const yFeet = (targetLat - centerLat) / DEG_PER_FOOT_LAT
  const xFeet = (targetLng - centerLng) / degPerFootLng(centerLat)

  // Apply reverse rotation if blueprint is rotated
  if (rotationDeg !== 0) {
    const rotRad = (-rotationDeg * Math.PI) / 180
    return {
      x: xFeet * Math.cos(rotRad) - yFeet * Math.sin(rotRad),
      y: xFeet * Math.sin(rotRad) + yFeet * Math.cos(rotRad),
    }
  }

  return { x: xFeet, y: yFeet }
}

/**
 * Convert canvas pixels to lat/lng using the project's geo reference
 *
 * @param canvasX - X position in canvas pixels
 * @param canvasY - Y position in canvas pixels
 * @param config - Project configuration
 */
export function canvasToLatLng(
  canvasX: number,
  canvasY: number,
  config: {
    centerLat: number
    centerLng: number
    pixelsPerFoot: number
    canvasWidth: number
    canvasHeight: number
    rotationDeg?: number
  }
): { lat: number; lng: number } {
  // Convert canvas position to offset from center (in pixels)
  const centerX = config.canvasWidth / 2
  const centerY = config.canvasHeight / 2
  const offsetXPx = canvasX - centerX
  const offsetYPx = centerY - canvasY  // Flip Y (canvas Y increases down, lat increases up)

  // Convert to feet
  const offsetXFeet = pixelsToFeet(offsetXPx, config.pixelsPerFoot)
  const offsetYFeet = pixelsToFeet(offsetYPx, config.pixelsPerFoot)

  // Convert to lat/lng
  return feetToLatLng(
    config.centerLat,
    config.centerLng,
    offsetXFeet,
    offsetYFeet,
    config.rotationDeg ?? 0
  )
}

/**
 * Convert lat/lng to canvas pixels
 */
export function latLngToCanvas(
  lat: number,
  lng: number,
  config: {
    centerLat: number
    centerLng: number
    pixelsPerFoot: number
    canvasWidth: number
    canvasHeight: number
    rotationDeg?: number
  }
): { x: number; y: number } {
  // Convert to feet offset
  const offset = latLngToFeet(
    config.centerLat,
    config.centerLng,
    lat,
    lng,
    config.rotationDeg ?? 0
  )

  // Convert to canvas pixels
  const centerX = config.canvasWidth / 2
  const centerY = config.canvasHeight / 2

  return {
    x: centerX + feetToPixels(offset.x, config.pixelsPerFoot),
    y: centerY - feetToPixels(offset.y, config.pixelsPerFoot),  // Flip Y
  }
}

/**
 * Calculate the bounding box for a set of vertices in lat/lng
 */
export function calculateGeoBounds(
  vertices: Array<{ x: number; y: number }>,
  config: {
    centerLat: number
    centerLng: number
    pixelsPerFoot: number
    canvasWidth: number
    canvasHeight: number
    rotationDeg?: number
  }
): {
  north: number
  south: number
  east: number
  west: number
  center: { lat: number; lng: number }
} {
  const geoVertices = vertices.map((v) =>
    canvasToLatLng(v.x, v.y, config)
  )

  const lats = geoVertices.map((v) => v.lat)
  const lngs = geoVertices.map((v) => v.lng)

  const north = Math.max(...lats)
  const south = Math.min(...lats)
  const east = Math.max(...lngs)
  const west = Math.min(...lngs)

  return {
    north,
    south,
    east,
    west,
    center: {
      lat: (north + south) / 2,
      lng: (east + west) / 2,
    },
  }
}

/**
 * Convert all room vertices to geo coordinates
 */
export function convertRoomToGeo(
  room: {
    vertices: Array<{ x: number; y: number }>
    name: string
    type: string
    areaSqFt: number
  },
  config: {
    centerLat: number
    centerLng: number
    pixelsPerFoot: number
    canvasWidth: number
    canvasHeight: number
    rotationDeg?: number
  }
): {
  name: string
  type: string
  areaSqFt: number
  geoVertices: Array<{ lat: number; lng: number }>
  bounds: ReturnType<typeof calculateGeoBounds>
} {
  const geoVertices = room.vertices.map((v) =>
    canvasToLatLng(v.x, v.y, config)
  )

  return {
    name: room.name,
    type: room.type,
    areaSqFt: room.areaSqFt,
    geoVertices,
    bounds: calculateGeoBounds(room.vertices, config),
  }
}
