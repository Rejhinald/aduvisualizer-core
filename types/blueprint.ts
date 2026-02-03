import { z } from "zod"

/**
 * Vertex - a point in canvas pixels
 */
export const VertexSchema = z.object({
  x: z.number(),
  y: z.number(),
})

export type Vertex = z.infer<typeof VertexSchema>

/**
 * Geo-coordinate point
 */
export const GeoPointSchema = z.object({
  lat: z.number(),
  lng: z.number(),
})

export type GeoPoint = z.infer<typeof GeoPointSchema>

/**
 * Room types - LA ADU / California Building Code compliant
 */
export const RoomTypeEnum = z.enum([
  "bedroom",      // Bedroom (min 70 sq ft per CA Building Code)
  "bathroom",     // Full Bathroom (shower/tub, toilet, sink)
  "half_bath",    // Half Bath/Powder Room (toilet, sink only)
  "kitchen",      // Kitchen (required for ADU)
  "living",       // Living Room/Great Room
  "dining",       // Dining Area
  "closet",       // Closet/Wardrobe
  "laundry",      // Laundry Room/Area
  "storage",      // Storage Room
  "utility",      // Utility/Mechanical Room
  "entry",        // Entry/Foyer
  "corridor",     // Hallway/Corridor
  "flex",         // Flex Space/Den/Office
  "other",        // Other/Custom
])

export type RoomType = z.infer<typeof RoomTypeEnum>

/**
 * Room schema
 */
export const RoomSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  type: RoomTypeEnum,
  description: z.string().optional(),
  color: z.string().optional(),
  vertices: z.array(VertexSchema).min(3),
  widthFeet: z.number().optional(),
  heightFeet: z.number().optional(),
  areaSqFt: z.number(),
  rotation: z.number().optional().default(0),
})

export type Room = z.infer<typeof RoomSchema>

/**
 * Door types
 */
export const DoorTypeEnum = z.enum([
  "single",
  "double",
  "sliding",
  "french",
  "open_passage",
])

export type DoorType = z.infer<typeof DoorTypeEnum>

/**
 * Door schema
 */
export const DoorSchema = z.object({
  id: z.string().uuid().optional(),
  type: DoorTypeEnum,
  x: z.number(),
  y: z.number(),
  widthFeet: z.number(),
  rotation: z.number().optional().default(0),
  isExterior: z.boolean().optional().default(false),
})

export type Door = z.infer<typeof DoorSchema>

/**
 * Window types
 */
export const WindowTypeEnum = z.enum([
  "standard",
  "bay",
  "picture",
  "sliding",
])

export type WindowType = z.infer<typeof WindowTypeEnum>

/**
 * Window schema
 */
export const WindowSchema = z.object({
  id: z.string().uuid().optional(),
  type: WindowTypeEnum,
  x: z.number(),
  y: z.number(),
  widthFeet: z.number(),
  heightFeet: z.number(),
  rotation: z.number().optional().default(0),
})

export type Window = z.infer<typeof WindowSchema>

/**
 * Furniture categories
 */
export const FurnitureCategoryEnum = z.enum([
  "bedroom",
  "bathroom",
  "kitchen",
  "living",
  "office",
])

export type FurnitureCategory = z.infer<typeof FurnitureCategoryEnum>

/**
 * Furniture schema
 */
export const FurnitureSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.string(),
  category: FurnitureCategoryEnum,
  name: z.string().optional(),
  x: z.number(),
  y: z.number(),
  widthFeet: z.number(),
  heightFeet: z.number(),
  rotation: z.number().optional().default(0),
})

export type Furniture = z.infer<typeof FurnitureSchema>

/**
 * Full blueprint save request schema
 */
export const SaveBlueprintSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().optional(),

  // Canvas configuration
  canvasWidth: z.number().default(800),
  canvasHeight: z.number().default(800),
  pixelsPerFoot: z.number().default(100),
  maxCanvasFeet: z.number().default(36),
  gridSize: z.number().default(100),

  // ADU boundary
  aduBoundary: z.array(VertexSchema).min(3),
  aduAreaSqFt: z.number(),

  // All elements
  rooms: z.array(RoomSchema),
  doors: z.array(DoorSchema),
  windows: z.array(WindowSchema),
  furniture: z.array(FurnitureSchema).optional().default([]),

  // Calculated totals
  totalRoomAreaSqFt: z.number().optional(),

  // Validation
  isValid: z.boolean().optional(),
  validationErrors: z.array(z.string()).optional(),
})

export type SaveBlueprintRequest = z.infer<typeof SaveBlueprintSchema>

/**
 * Blueprint entity (from database)
 */
export interface BlueprintEntity {
  id: string
  projectId: string
  version: number
  name: string | null
  canvasWidth: number
  canvasHeight: number
  pixelsPerFoot: number
  maxCanvasFeet: number
  gridSize: number
  aduBoundary: Vertex[]
  aduAreaSqFt: number
  totalRoomAreaSqFt: number
  isValid: boolean
  validationErrors: string[] | null
  createdAt: Date
  updatedAt: Date
}

/**
 * Room entity with geo-coordinates
 */
export interface RoomWithGeo extends Room {
  id: string
  positionCanvas: Vertex
  positionFeet: Vertex
  positionGeo: GeoPoint
  verticesGeo: GeoPoint[]
}

/**
 * Door entity with geo-coordinates
 */
export interface DoorWithGeo extends Door {
  id: string
  positionCanvas: Vertex
  positionFeet: Vertex
  positionGeo: GeoPoint
}

/**
 * Window entity with geo-coordinates
 */
export interface WindowWithGeo extends Window {
  id: string
  positionCanvas: Vertex
  positionFeet: Vertex
  positionGeo: GeoPoint
}

/**
 * Furniture entity with geo-coordinates
 */
export interface FurnitureWithGeo extends Furniture {
  id: string
  positionCanvas: Vertex
  positionFeet: Vertex
  positionGeo: GeoPoint
}

/**
 * Geo bounds for satellite overlay
 */
export interface GeoBounds {
  north: number
  south: number
  east: number
  west: number
  center: GeoPoint
}

/**
 * Blueprint with geo-coordinates response
 */
export interface BlueprintWithGeoResponse {
  blueprint: BlueprintEntity & {
    aduBoundaryGeo: GeoPoint[]
  }
  project: {
    id: string
    name: string
    geoLocation: {
      lat: number
      lng: number
      rotation: number
    }
  }
  geoBounds: GeoBounds
  rooms: RoomWithGeo[]
  doors: DoorWithGeo[]
  windows: WindowWithGeo[]
  furniture: FurnitureWithGeo[]
  geoConfig: {
    canvasCenter: Vertex
    pixelsPerFoot: number
    rotation: number
  }
}
