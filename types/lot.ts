import { z } from "zod"
import { GeoPointSchema } from "./blueprint"

/**
 * Data source enum for lot data
 */
export const LotDataSourceEnum = z.enum([
  "orange_county_gis",  // From Orange County GIS ArcGIS REST API
  "manual",             // Manually entered by user
  "nominatim",          // From OpenStreetMap Nominatim geocoding
])

export type LotDataSource = z.infer<typeof LotDataSourceEnum>

/**
 * Lot boundary vertex (in geographic coordinates)
 */
export const LotBoundaryVertexSchema = GeoPointSchema

export type LotBoundaryVertex = z.infer<typeof LotBoundaryVertexSchema>

/**
 * Create lot schema (for POST requests)
 * Using .nullish() to accept null, undefined, or valid values (for snapshot restore)
 */
export const CreateLotSchema = z.object({
  blueprintId: z.string().uuid(),

  // Parcel identification
  parcelNumber: z.string().max(50).nullish(),

  // Address
  address: z.string().nullish(),
  city: z.string().max(100).nullish(),
  state: z.string().max(50).nullish().default("CA"),
  zipCode: z.string().max(20).nullish(),

  // Geographic center (required)
  geoLat: z.number().min(-90).max(90),
  geoLng: z.number().min(-180).max(180),
  geoRotation: z.number().min(0).max(360).default(0),

  // Lot boundary (optional - may be added later from GIS)
  boundaryVertices: z.array(LotBoundaryVertexSchema).min(3).nullish(),

  // Lot dimensions (in feet)
  lotWidthFeet: z.number().positive().nullish(),
  lotDepthFeet: z.number().positive().nullish(),
  lotAreaSqFt: z.number().positive().nullish(),

  // ADU position on lot (in feet from lot center)
  aduOffsetX: z.number().default(0),
  aduOffsetY: z.number().default(0),
  aduRotation: z.number().min(0).max(360).default(0),

  // Setbacks (LA ADU defaults)
  setbackFrontFeet: z.number().min(0).default(0),
  setbackBackFeet: z.number().min(0).default(4),
  setbackLeftFeet: z.number().min(0).default(4),
  setbackRightFeet: z.number().min(0).default(4),

  // Data source
  dataSource: LotDataSourceEnum.nullish(),
})

export type CreateLotInput = z.infer<typeof CreateLotSchema>

/**
 * Update lot schema (for PUT/PATCH requests)
 * Using .nullish() to accept null, undefined, or valid values (for snapshot restore)
 */
export const UpdateLotSchema = z.object({
  // Parcel identification
  parcelNumber: z.string().max(50).nullish(),

  // Address
  address: z.string().nullish(),
  city: z.string().max(100).nullish(),
  state: z.string().max(50).nullish(),
  zipCode: z.string().max(20).nullish(),

  // Geographic center
  geoLat: z.number().min(-90).max(90).nullish(),
  geoLng: z.number().min(-180).max(180).nullish(),
  geoRotation: z.number().min(0).max(360).nullish(),

  // Lot boundary
  boundaryVertices: z.array(LotBoundaryVertexSchema).min(3).nullish(),

  // Lot dimensions
  lotWidthFeet: z.number().positive().nullish(),
  lotDepthFeet: z.number().positive().nullish(),
  lotAreaSqFt: z.number().positive().nullish(),

  // ADU position on lot
  aduOffsetX: z.number().nullish(),
  aduOffsetY: z.number().nullish(),
  aduRotation: z.number().min(0).max(360).nullish(),

  // Setbacks
  setbackFrontFeet: z.number().min(0).nullish(),
  setbackBackFeet: z.number().min(0).nullish(),
  setbackLeftFeet: z.number().min(0).nullish(),
  setbackRightFeet: z.number().min(0).nullish(),

  // Data source
  dataSource: LotDataSourceEnum.nullish(),
})

export type UpdateLotInput = z.infer<typeof UpdateLotSchema>

/**
 * Lot response schema (what the API returns)
 */
export const LotSchema = z.object({
  id: z.string().uuid(),
  blueprintId: z.string().uuid(),

  parcelNumber: z.string().nullable(),

  address: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  zipCode: z.string().nullable(),

  geoLat: z.number(),
  geoLng: z.number(),
  geoRotation: z.number(),

  boundaryVertices: z.array(LotBoundaryVertexSchema).nullable(),

  lotWidthFeet: z.number().nullable(),
  lotDepthFeet: z.number().nullable(),
  lotAreaSqFt: z.number().nullable(),

  aduOffsetX: z.number(),
  aduOffsetY: z.number(),
  aduRotation: z.number(),

  setbackFrontFeet: z.number(),
  setbackBackFeet: z.number(),
  setbackLeftFeet: z.number(),
  setbackRightFeet: z.number(),

  dataSource: z.string().nullable(),

  isDeleted: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type Lot = z.infer<typeof LotSchema>

/**
 * Address search request schema
 */
export const SearchAddressSchema = z.object({
  query: z.string().min(3).max(200),
  limit: z.number().min(1).max(10).default(5),
})

export type SearchAddressInput = z.infer<typeof SearchAddressSchema>

/**
 * Address search result schema (from Nominatim)
 */
export const AddressResultSchema = z.object({
  placeId: z.string(),
  displayName: z.string(),
  lat: z.number(),
  lng: z.number(),
  boundingBox: z.array(z.number()).length(4).optional(), // [south, north, west, east]
  addressComponents: z.object({
    houseNumber: z.string().optional(),
    road: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postcode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
})

export type AddressResult = z.infer<typeof AddressResultSchema>

/**
 * Parcel data request schema
 */
export const GetParcelSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
})

export type GetParcelInput = z.infer<typeof GetParcelSchema>

/**
 * Parcel data response schema (from Orange County GIS)
 */
export const ParcelDataSchema = z.object({
  parcelNumber: z.string(), // APN
  situsAddress: z.string().optional(),
  ownerName: z.string().optional(),
  boundaryVertices: z.array(LotBoundaryVertexSchema),
  areaSqFt: z.number().optional(),
  // Bounding box for quick dimension estimation
  bounds: z.object({
    north: z.number(),
    south: z.number(),
    east: z.number(),
    west: z.number(),
  }).optional(),
})

export type ParcelData = z.infer<typeof ParcelDataSchema>
