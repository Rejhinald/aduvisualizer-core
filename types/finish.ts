import { z } from "zod"

/**
 * Vibe options enum
 */
export const VibeEnum = z.enum([
  "modern_minimal",
  "scandinavian",
  "industrial",
  "bohemian",
  "midcentury",
  "coastal",
  "farmhouse",
  "luxury",
])

export type Vibe = z.infer<typeof VibeEnum>

/**
 * Quality tier enum
 */
export const TierEnum = z.enum(["budget", "standard", "premium"])

export type Tier = z.infer<typeof TierEnum>

/**
 * Template presets enum
 */
export const TemplateEnum = z.enum([
  "builder_basic",
  "modern_minimal",
  "warm_contemporary",
  "scandinavian_light",
  "industrial_chic",
  "coastal_casual",
  "midcentury_modern",
  "luxury_contemporary",
])

export type Template = z.infer<typeof TemplateEnum>

/**
 * FOV options for camera
 */
export const FovEnum = z.enum(["30", "60", "90"])

export type Fov = z.infer<typeof FovEnum>

/**
 * Lifestyle options by room type (for validation)
 */
export const LIFESTYLE_OPTIONS = {
  living: ["tv-setup", "gaming-corner", "reading-nook", "home-office"],
  bedroom: ["work-from-bed", "vanity-station", "reading-corner"],
  kitchen: ["coffee-bar", "breakfast-nook", "wine-storage"],
  dining: ["formal-setting", "casual-setting", "bar-cart"],
  bathroom: ["spa-vibes", "minimal-functional"],
  half_bath: ["minimal-functional"],
  corridor: [],
  closet: [],
  storage: [],
  utility: [],
  laundry: ["extra-storage", "folding-station"],
} as const

export type LifestyleRoomType = keyof typeof LIFESTYLE_OPTIONS

/**
 * Room finish schema
 */
export const RoomFinishSchema = z.object({
  roomId: z.string(),
  roomName: z.string(),
  roomType: z.string(),
  vibe: VibeEnum,
  tier: TierEnum,
  lifestyle: z.array(z.string()).default([]),
  customNotes: z.string().max(500).optional(),
})

export type RoomFinish = z.infer<typeof RoomFinishSchema>

/**
 * Camera placement schema
 */
export const CameraPlacementSchema = z.object({
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  rotation: z.number().min(0).max(360),
  fov: z.union([z.literal(30), z.literal(60), z.literal(90)]),
  height: z.number().min(1).max(10), // feet
})

export type CameraPlacement = z.infer<typeof CameraPlacementSchema>

/**
 * Render record schema
 */
export const RenderRecordSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["topdown", "firstperson"]),
  quality: z.enum(["preview", "final"]),
  url: z.string().url(),
  prompt: z.string().optional(),
  generatedAt: z.string().datetime(),
})

export type RenderRecord = z.infer<typeof RenderRecordSchema>

/**
 * Create finishes schema (for POST requests)
 */
export const CreateFinishSchema = z.object({
  blueprintId: z.string().uuid(),
  globalTemplate: TemplateEnum.optional(),
  globalTier: TierEnum.default("standard"),
  roomFinishes: z.array(RoomFinishSchema).default([]),
  cameraPlacement: CameraPlacementSchema.nullable().optional(),
})

export type CreateFinishInput = z.infer<typeof CreateFinishSchema>

/**
 * Update finishes schema (for PUT/PATCH requests)
 */
export const UpdateFinishSchema = z.object({
  globalTemplate: TemplateEnum.nullish(),
  globalTier: TierEnum.optional(),
  roomFinishes: z.array(RoomFinishSchema).optional(),
  cameraPlacement: CameraPlacementSchema.nullable().optional(),
})

export type UpdateFinishInput = z.infer<typeof UpdateFinishSchema>

/**
 * Update single room finish schema (also used for adding new rooms)
 */
export const UpdateRoomFinishSchema = z.object({
  roomId: z.string(),
  roomName: z.string().optional(),
  roomType: z.string().optional(),
  vibe: VibeEnum.optional(),
  tier: TierEnum.optional(),
  lifestyle: z.array(z.string()).optional(),
  customNotes: z.string().max(500).optional(),
})

export type UpdateRoomFinishInput = z.infer<typeof UpdateRoomFinishSchema>

/**
 * Update camera placement schema
 */
export const UpdateCameraSchema = CameraPlacementSchema.partial()

export type UpdateCameraInput = z.infer<typeof UpdateCameraSchema>

/**
 * Finishes response schema (what the API returns)
 */
export const FinishSchema = z.object({
  id: z.string().uuid(),
  blueprintId: z.string().uuid(),

  globalTemplate: z.string().nullable(),
  globalTier: z.string(),

  roomFinishes: z.array(RoomFinishSchema),
  cameraPlacement: CameraPlacementSchema.nullable(),

  topDownPreviewUrl: z.string().nullable(),
  topDownFinalUrl: z.string().nullable(),
  firstPersonPreviewUrl: z.string().nullable(),
  firstPersonFinalUrl: z.string().nullable(),

  renderHistory: z.array(RenderRecordSchema),

  isDeleted: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type Finish = z.infer<typeof FinishSchema>

/**
 * Generate render request schema
 */
export const GenerateRenderSchema = z.object({
  blueprintId: z.string().uuid(),
  type: z.enum(["topdown", "firstperson"]),
  quality: z.enum(["preview", "final"]).default("preview"),
})

export type GenerateRenderInput = z.infer<typeof GenerateRenderSchema>

/**
 * Template definitions with defaults
 */
export const TEMPLATE_DEFINITIONS: Record<Template, {
  label: string
  description: string
  defaultVibe: Vibe
  defaultTier: Tier
  keywords: string[]
}> = {
  builder_basic: {
    label: "Builder Basic",
    description: "White walls, beige carpet, basic fixtures",
    defaultVibe: "modern_minimal",
    defaultTier: "budget",
    keywords: ["simple", "neutral", "clean", "basic"],
  },
  modern_minimal: {
    label: "Modern Minimal",
    description: "Clean lines, neutral palette, integrated storage",
    defaultVibe: "modern_minimal",
    defaultTier: "standard",
    keywords: ["minimalist", "clean", "white", "sleek", "contemporary"],
  },
  warm_contemporary: {
    label: "Warm Contemporary",
    description: "Wood tones, warm grays, brass accents",
    defaultVibe: "modern_minimal",
    defaultTier: "standard",
    keywords: ["warm", "wood", "brass", "cozy", "inviting"],
  },
  scandinavian_light: {
    label: "Scandinavian Light",
    description: "White + light wood, minimal, functional",
    defaultVibe: "scandinavian",
    defaultTier: "standard",
    keywords: ["nordic", "light", "airy", "functional", "hygge"],
  },
  industrial_chic: {
    label: "Industrial Chic",
    description: "Exposed elements, concrete, metal accents",
    defaultVibe: "industrial",
    defaultTier: "standard",
    keywords: ["urban", "loft", "exposed", "raw", "metal"],
  },
  coastal_casual: {
    label: "Coastal Casual",
    description: "Blues, whites, natural textures",
    defaultVibe: "coastal",
    defaultTier: "standard",
    keywords: ["beach", "ocean", "relaxed", "breezy", "natural"],
  },
  midcentury_modern: {
    label: "Mid-Century Modern",
    description: "Retro colors, wood, statement pieces",
    defaultVibe: "midcentury",
    defaultTier: "premium",
    keywords: ["retro", "atomic", "organic", "vintage", "iconic"],
  },
  luxury_contemporary: {
    label: "Luxury Contemporary",
    description: "Premium materials, dramatic lighting",
    defaultVibe: "luxury",
    defaultTier: "premium",
    keywords: ["high-end", "designer", "marble", "statement", "sophisticated"],
  },
}

/**
 * Vibe definitions with metadata
 */
export const VIBE_DEFINITIONS: Record<Vibe, {
  label: string
  description: string
  colors: string[]
  materials: string[]
  thumbnail?: string
}> = {
  modern_minimal: {
    label: "Modern Minimal",
    description: "Clean lines, neutral colors, uncluttered spaces",
    colors: ["white", "gray", "black", "beige"],
    materials: ["smooth surfaces", "glass", "steel", "matte finishes"],
  },
  scandinavian: {
    label: "Scandinavian",
    description: "Light, airy, functional with natural elements",
    colors: ["white", "light gray", "pale blue", "natural wood"],
    materials: ["light wood", "wool", "cotton", "ceramic"],
  },
  industrial: {
    label: "Industrial",
    description: "Raw, urban aesthetic with exposed elements",
    colors: ["gray", "black", "rust", "natural wood"],
    materials: ["exposed brick", "metal", "concrete", "reclaimed wood"],
  },
  bohemian: {
    label: "Bohemian",
    description: "Eclectic, colorful, globally-inspired",
    colors: ["terracotta", "teal", "mustard", "burgundy"],
    materials: ["textiles", "macrame", "rattan", "plants"],
  },
  midcentury: {
    label: "Mid-Century Modern",
    description: "Retro-inspired with organic shapes",
    colors: ["orange", "teal", "mustard", "walnut"],
    materials: ["teak", "walnut", "brass", "terrazzo"],
  },
  coastal: {
    label: "Coastal",
    description: "Beach-inspired, relaxed, natural",
    colors: ["blue", "white", "sand", "seafoam"],
    materials: ["linen", "driftwood", "rope", "wicker"],
  },
  farmhouse: {
    label: "Farmhouse",
    description: "Rustic charm with modern comfort",
    colors: ["white", "cream", "sage", "navy"],
    materials: ["shiplap", "barn wood", "galvanized metal", "cotton"],
  },
  luxury: {
    label: "Luxury Contemporary",
    description: "High-end finishes, statement pieces",
    colors: ["black", "gold", "marble white", "deep jewel tones"],
    materials: ["marble", "velvet", "brass", "crystal"],
  },
}
