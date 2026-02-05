import { z } from "zod"

/**
 * Blueprint v2 Types - Corner/Wall Graph Model
 * All coordinates are in FEET (decimal)
 */

// ============================================
// Basic Types
// ============================================

/**
 * Point - 2D coordinate in feet
 */
export const PointSchema = z.object({
  x: z.number(),
  y: z.number(),
})

export type Point = z.infer<typeof PointSchema>

// ============================================
// Corner
// ============================================

/**
 * Corner - foundation of the wall graph
 * For save requests, id can be temp ID or omitted
 */
export const CornerInputSchema = z.object({
  id: z.string().optional(),   // temp ID or UUID, optional for new
  x: z.number(),               // feet
  y: z.number(),               // feet
  elevation: z.number().default(0), // for multi-level support
})

export const CornerSchema = z.object({
  id: z.string().uuid().optional(),
  x: z.number(),          // feet
  y: z.number(),          // feet
  elevation: z.number().default(0), // for multi-level support
})

export type Corner = z.infer<typeof CornerSchema>

export const CreateCornerSchema = CornerSchema.omit({ id: true })
export type CreateCorner = z.infer<typeof CreateCornerSchema>

export const UpdateCornerSchema = z.object({
  x: z.number().optional(),
  y: z.number().optional(),
  elevation: z.number().optional(),
})
export type UpdateCorner = z.infer<typeof UpdateCornerSchema>

// ============================================
// Wall
// ============================================

/**
 * Wall type - determines rendering behavior
 * - "solid": Physical wall, renders in 3D
 * - "virtual": Room divider, no 3D geometry (just defines floor zones)
 * - "partition": Half-height wall (future feature)
 */
export const WallTypeEnum = z.enum(["solid", "virtual", "partition"])
export type WallType = z.infer<typeof WallTypeEnum>

/**
 * Wall - connects two corners
 * For save requests, IDs can be temp IDs
 */
export const WallInputSchema = z.object({
  id: z.string().optional(),
  startCornerId: z.string(),     // temp ID or UUID
  endCornerId: z.string(),       // temp ID or UUID
  thickness: z.number().default(0.5),
  height: z.number().default(9),
  wallType: WallTypeEnum.default("solid"),
})

export const WallSchema = z.object({
  id: z.string().uuid().optional(),
  startCornerId: z.string().uuid(),
  endCornerId: z.string().uuid(),
  thickness: z.number().default(0.5),  // feet (6 inches)
  height: z.number().default(9),       // feet (9 foot ceiling)
  wallType: WallTypeEnum.default("solid"),
})

export type Wall = z.infer<typeof WallSchema>

export const CreateWallSchema = WallSchema.omit({ id: true })
export type CreateWall = z.infer<typeof CreateWallSchema>

export const UpdateWallSchema = z.object({
  thickness: z.number().optional(),
  height: z.number().optional(),
  wallType: WallTypeEnum.optional(),
})
export type UpdateWall = z.infer<typeof UpdateWallSchema>

// ============================================
// Door
// ============================================

export const DoorTypeEnumV2 = z.enum([
  "single",
  "double",
  "sliding",
  "french",
  "opening",
])

export type DoorTypeV2 = z.infer<typeof DoorTypeEnumV2>

/**
 * Door - placed on a wall at a position (0-1)
 * For save requests, wallId can be temp ID
 */
export const DoorInputSchemaV2 = z.object({
  id: z.string().optional(),
  wallId: z.string(),           // temp ID or UUID
  position: z.number().min(0).max(1),
  type: DoorTypeEnumV2.default("single"),
  width: z.number().default(3),
  height: z.number().default(6.67),
  orientation: z.number().min(0).max(3).default(0), // 0-3: hinge/swing direction
})

export const DoorSchemaV2 = z.object({
  id: z.string().uuid().optional(),
  wallId: z.string().uuid(),
  position: z.number().min(0).max(1),  // 0-1 along wall length
  type: DoorTypeEnumV2.default("single"),
  width: z.number().default(3),         // feet (36 inches)
  height: z.number().default(6.67),     // feet (80 inches)
  orientation: z.number().min(0).max(3).default(0), // 0-3: hinge/swing direction
})

export type DoorV2 = z.infer<typeof DoorSchemaV2>

export const CreateDoorSchemaV2 = DoorSchemaV2.omit({ id: true })
export type CreateDoorV2 = z.infer<typeof CreateDoorSchemaV2>

export const UpdateDoorSchemaV2 = z.object({
  position: z.number().min(0).max(1).optional(),
  type: DoorTypeEnumV2.optional(),
  width: z.number().optional(),
  height: z.number().optional(),
})
export type UpdateDoorV2 = z.infer<typeof UpdateDoorSchemaV2>

// ============================================
// Window
// ============================================

export const WindowTypeEnumV2 = z.enum([
  "standard",
  "bay",
  "picture",
  "sliding",
])

export type WindowTypeV2 = z.infer<typeof WindowTypeEnumV2>

/**
 * Window - placed on a wall at a position (0-1)
 * For save requests, wallId can be temp ID
 */
export const WindowInputSchemaV2 = z.object({
  id: z.string().optional(),
  wallId: z.string(),           // temp ID or UUID
  position: z.number().min(0).max(1),
  type: WindowTypeEnumV2.default("standard"),
  width: z.number().default(3),
  height: z.number().default(4),
  sillHeight: z.number().default(3),
})

export const WindowSchemaV2 = z.object({
  id: z.string().uuid().optional(),
  wallId: z.string().uuid(),
  position: z.number().min(0).max(1),  // 0-1 along wall length
  type: WindowTypeEnumV2.default("standard"),
  width: z.number().default(3),         // feet (36 inches)
  height: z.number().default(4),        // feet (48 inches)
  sillHeight: z.number().default(3),    // feet from floor (36 inches)
})

export type WindowV2 = z.infer<typeof WindowSchemaV2>

export const CreateWindowSchemaV2 = WindowSchemaV2.omit({ id: true })
export type CreateWindowV2 = z.infer<typeof CreateWindowSchemaV2>

export const UpdateWindowSchemaV2 = z.object({
  position: z.number().min(0).max(1).optional(),
  type: WindowTypeEnumV2.optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  sillHeight: z.number().optional(),
})
export type UpdateWindowV2 = z.infer<typeof UpdateWindowSchemaV2>

// ============================================
// Furniture
// ============================================

export const FurnitureTypeEnumV2 = z.enum([
  // Bedroom
  "bed_queen",
  "bed_king",
  "bed_twin",
  "dresser",
  "nightstand",
  // Bathroom
  "toilet",
  "sink",
  "bathtub",
  "shower",
  // Kitchen
  "refrigerator",
  "stove",
  "dishwasher",
  "kitchen_sink",
  // Living
  "sofa_3seat",
  "sofa_2seat",
  "armchair",
  "coffee_table",
  "dining_table",
  "dining_chair",
  // Office
  "desk",
  "office_chair",
  "bookshelf",
])

export type FurnitureTypeV2 = z.infer<typeof FurnitureTypeEnumV2>

/**
 * Furniture - free placement
 * For save requests, id can be temp ID or omitted
 */
export const FurnitureInputSchemaV2 = z.object({
  id: z.string().optional(),
  type: FurnitureTypeEnumV2,
  x: z.number(),
  y: z.number(),
  rotation: z.number().default(0),
  width: z.number(),
  depth: z.number(),
})

export const FurnitureSchemaV2 = z.object({
  id: z.string().uuid().optional(),
  type: FurnitureTypeEnumV2,
  x: z.number(),          // feet
  y: z.number(),          // feet
  rotation: z.number().default(0),   // degrees
  width: z.number(),      // feet
  depth: z.number(),      // feet
})

export type FurnitureV2 = z.infer<typeof FurnitureSchemaV2>

export const CreateFurnitureSchemaV2 = FurnitureSchemaV2.omit({ id: true })
export type CreateFurnitureV2 = z.infer<typeof CreateFurnitureSchemaV2>

export const UpdateFurnitureSchemaV2 = z.object({
  x: z.number().optional(),
  y: z.number().optional(),
  rotation: z.number().optional(),
  width: z.number().optional(),
  depth: z.number().optional(),
})
export type UpdateFurnitureV2 = z.infer<typeof UpdateFurnitureSchemaV2>

// ============================================
// Boundary Corner (for ADU boundary shape)
// ============================================

/**
 * Boundary Corner - defines the ADU boundary polygon vertices
 * Same concept as Corner but for the buildable area boundary
 * For save requests, id can be temp ID or omitted
 */
export const BoundaryCornerInputSchema = z.object({
  id: z.string().optional(),   // temp ID or UUID
  x: z.number(),               // feet
  y: z.number(),               // feet
  orderIndex: z.number().default(0),  // order in polygon
})

export const BoundaryCornerSchema = z.object({
  id: z.string().uuid().optional(),
  x: z.number(),          // feet
  y: z.number(),          // feet
  orderIndex: z.number().default(0),
})

export type BoundaryCorner = z.infer<typeof BoundaryCornerSchema>

// ============================================
// Boundary Wall (for ADU boundary edges)
// ============================================

/**
 * Boundary Wall - connects two boundary corners
 * Same concept as Wall but for the buildable area boundary edges
 * Not rendered in 3D, only used for 2D boundary guide
 */
export const BoundaryWallInputSchema = z.object({
  id: z.string().optional(),
  startCornerId: z.string(),     // temp ID or UUID
  endCornerId: z.string(),       // temp ID or UUID
})

export const BoundaryWallSchema = z.object({
  id: z.string().uuid().optional(),
  startCornerId: z.string().uuid(),
  endCornerId: z.string().uuid(),
})

export type BoundaryWall = z.infer<typeof BoundaryWallSchema>

// ============================================
// Room (computed, not stored)
// ============================================

export const RoomTypeEnumV2 = z.enum([
  "bedroom",
  "bathroom",
  "half_bath",
  "kitchen",
  "living",
  "dining",
  "closet",
  "laundry",
  "storage",
  "utility",
  "entry",
  "corridor",
  "flex",
  "other",
])

export type RoomTypeV2 = z.infer<typeof RoomTypeEnumV2>

/**
 * Room - computed from wall graph (not stored in DB)
 */
export const RoomSchemaV2 = z.object({
  id: z.string(),
  corners: z.array(CornerSchema),  // ordered CCW
  walls: z.array(WallSchema),
  area: z.number(),                 // sq ft
  center: PointSchema,
  name: z.string(),
  type: RoomTypeEnumV2,
})

export type RoomV2 = z.infer<typeof RoomSchemaV2>

// ============================================
// Lot
// ============================================

export const SetbacksSchema = z.object({
  front: z.number().default(0),
  back: z.number().default(4),
  left: z.number().default(4),
  right: z.number().default(4),
})

export type Setbacks = z.infer<typeof SetbacksSchema>

export const LotSourceEnum = z.enum(["gis", "manual"])

export const LotSchemaV2 = z.object({
  id: z.string().uuid().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  geoLat: z.number().optional(),
  geoLng: z.number().optional(),
  boundary: z.array(PointSchema).optional(), // in feet
  setbacks: SetbacksSchema.default({
    front: 0,
    back: 4,
    left: 4,
    right: 4,
  }),
  source: LotSourceEnum.default("manual"),
})

export type LotV2 = z.infer<typeof LotSchemaV2>

// ============================================
// Blueprint Data (complete state)
// ============================================

/**
 * Save blueprint request - uses input schemas that accept temp IDs
 */
export const SaveBlueprintSchemaV2 = z.object({
  projectId: z.string().uuid(),
  name: z.string().optional(),

  // Core graph data (accepts temp IDs)
  corners: z.array(CornerInputSchema),
  walls: z.array(WallInputSchema),

  // Elements on walls (accepts temp wall IDs)
  doors: z.array(DoorInputSchemaV2).default([]),
  windows: z.array(WindowInputSchemaV2).default([]),

  // Free placement
  furniture: z.array(FurnitureInputSchemaV2).default([]),

  // ADU Boundary (accepts temp IDs) - defines the buildable area shape
  boundaryCorners: z.array(BoundaryCornerInputSchema).default([]),
  boundaryWalls: z.array(BoundaryWallInputSchema).default([]),

  // Lot (optional)
  lot: LotSchemaV2.optional(),
})

export type SaveBlueprintRequestV2 = z.infer<typeof SaveBlueprintSchemaV2>

/**
 * Blueprint response - includes computed rooms
 */
export const BlueprintResponseSchemaV2 = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  name: z.string().nullable(),
  version: z.number(),

  // Core graph data
  corners: z.array(CornerSchema.extend({ id: z.string().uuid() })),
  walls: z.array(WallSchema.extend({ id: z.string().uuid() })),

  // Elements
  doors: z.array(DoorSchemaV2.extend({ id: z.string().uuid() })),
  windows: z.array(WindowSchemaV2.extend({ id: z.string().uuid() })),
  furniture: z.array(FurnitureSchemaV2.extend({ id: z.string().uuid() })),

  // ADU Boundary - defines the buildable area shape
  boundaryCorners: z.array(BoundaryCornerSchema.extend({ id: z.string().uuid() })),
  boundaryWalls: z.array(BoundaryWallSchema.extend({ id: z.string().uuid() })),

  // Computed rooms
  rooms: z.array(RoomSchemaV2),

  // Lot
  lot: LotSchemaV2.extend({ id: z.string().uuid() }).optional(),

  // Metadata
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type BlueprintResponseV2 = z.infer<typeof BlueprintResponseSchemaV2>

// ============================================
// Standard Dimensions (constants)
// ============================================

export const STANDARD_DIMENSIONS = {
  // Wall
  WALL_THICKNESS: 0.5,         // 6 inches
  WALL_HEIGHT: 9,              // 9 feet ceiling

  // Doors
  DOOR_WIDTH_SINGLE: 3,        // 36 inches
  DOOR_WIDTH_DOUBLE: 6,        // 72 inches
  DOOR_HEIGHT: 6.67,           // 80 inches (6'8")

  // Windows
  WINDOW_WIDTH_STANDARD: 3,    // 36 inches
  WINDOW_HEIGHT_STANDARD: 4,   // 48 inches
  WINDOW_SILL_HEIGHT: 3,       // 36 inches

  // Grid
  GRID_SIZE_MAJOR: 1,          // 1 foot
  GRID_SIZE_MINOR: 0.5,        // 6 inches

  // Minimum dimensions
  MIN_ROOM_DIMENSION: 3,       // 3 feet
  MIN_HALLWAY_WIDTH: 3,        // 3 feet
} as const

// ============================================
// Default Furniture Dimensions
// ============================================

export const FURNITURE_DIMENSIONS: Record<FurnitureTypeV2, { width: number; depth: number }> = {
  // Bedroom
  bed_queen: { width: 5, depth: 6.67 },
  bed_king: { width: 6.33, depth: 6.67 },
  bed_twin: { width: 3.25, depth: 6.33 },
  dresser: { width: 5, depth: 1.5 },
  nightstand: { width: 2, depth: 1.5 },

  // Bathroom
  toilet: { width: 1.5, depth: 2.33 },
  sink: { width: 2, depth: 1.5 },
  bathtub: { width: 2.5, depth: 5 },
  shower: { width: 3, depth: 3 },

  // Kitchen
  refrigerator: { width: 3, depth: 2.5 },
  stove: { width: 2.5, depth: 2.5 },
  dishwasher: { width: 2, depth: 2 },
  kitchen_sink: { width: 2.5, depth: 2 },

  // Living
  sofa_3seat: { width: 7, depth: 3 },
  sofa_2seat: { width: 5, depth: 3 },
  armchair: { width: 2.5, depth: 2.5 },
  coffee_table: { width: 4, depth: 2 },
  dining_table: { width: 6, depth: 3 },
  dining_chair: { width: 1.5, depth: 1.5 },

  // Office
  desk: { width: 5, depth: 2.5 },
  office_chair: { width: 2, depth: 2 },
  bookshelf: { width: 3, depth: 1 },
}
