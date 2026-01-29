import { z } from "zod"
import { GeoPointSchema, type GeoPoint } from "./blueprint"

/**
 * Project status
 */
export const ProjectStatusEnum = z.enum([
  "draft",
  "in_progress",
  "completed",
  "archived",
])

export type ProjectStatus = z.infer<typeof ProjectStatusEnum>

/**
 * Create project request schema
 */
export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
})

export type CreateProjectRequest = z.infer<typeof CreateProjectSchema>

/**
 * Update project request schema
 */
export const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: ProjectStatusEnum.optional(),
})

export type UpdateProjectRequest = z.infer<typeof UpdateProjectSchema>

/**
 * Set geo-location request schema
 */
export const SetGeoLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  rotation: z.number().min(0).max(360).optional().default(0),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  lotWidthFeet: z.number().positive().optional(),
  lotDepthFeet: z.number().positive().optional(),
})

export type SetGeoLocationRequest = z.infer<typeof SetGeoLocationSchema>

/**
 * Project entity (from database)
 */
export interface ProjectEntity {
  id: string
  name: string
  description: string | null
  geoLat: number | null
  geoLng: number | null
  geoRotation: number | null
  address: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  country: string | null
  lotWidthFeet: number | null
  lotDepthFeet: number | null
  status: ProjectStatus
  createdAt: Date
  updatedAt: Date
  isDeleted: boolean
}

/**
 * Project response (API)
 */
export interface ProjectResponse {
  id: string
  name: string
  description?: string
  geoLat?: number
  geoLng?: number
  geoRotation?: number
  address?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  lotWidthFeet?: number
  lotDepthFeet?: number
  status: string
  createdAt: string
  updatedAt: string
}

/**
 * Geo-location configuration
 */
export interface GeoLocationConfig {
  centerLat: number
  centerLng: number
  rotation: number
  address?: string
}
