/**
 * Pollinations AI Client for Image Generation
 *
 * Authenticated API at gen.pollinations.ai
 * Docs: https://gen.pollinations.ai (Scalar API docs)
 *
 * Pricing (very cheap):
 * - flux (Flux Schnell): ~$0.0002/img - best quality/price ratio
 * - zimage (Z-Image Turbo): ~$0.0002/img - fastest
 * - turbo: legacy alias for zimage
 *
 * API Key required - set POLLINATIONS_API_KEY env var
 */

export type PollinationsModel = "flux" | "zimage" | "turbo"

export type RenderQuality = "preview" | "final"

export interface GenerateImageOptions {
  prompt: string
  quality: RenderQuality
  width?: number
  height?: number
  model?: PollinationsModel
  seed?: number
  enhance?: boolean
}

export interface GenerateImageResult {
  success: boolean
  imageUrl?: string
  imageBase64?: string
  mimeType?: string
  error?: string
}

/**
 * Maximum URL length to stay safe across servers/browsers
 */
const MAX_PROMPT_LENGTH = 2000

/**
 * Pollinations API Key
 */
const POLLINATIONS_API_KEY = process.env.POLLINATIONS_API_KEY

if (!POLLINATIONS_API_KEY) {
  console.warn("[PollinationsClient] POLLINATIONS_API_KEY not set - image generation will fail")
}

/**
 * Models to try in order (fallback chain)
 * zimage/turbo are fastest, flux is best quality
 */
const MODEL_FALLBACK_CHAIN: PollinationsModel[] = ["zimage", "flux"]

/**
 * Condense a detailed architectural prompt into a shorter version
 */
function condensePrompt(prompt: string): string {
  if (prompt.length <= MAX_PROMPT_LENGTH) {
    return prompt
  }

  console.log("[PollinationsClient] Prompt too long (" + prompt.length + " chars), condensing...")

  const keywords: string[] = []

  // Extract ADU dimensions
  const dimensionsMatch = prompt.match(/Total footprint: (\d+)' wide × (\d+)' deep/)
  if (dimensionsMatch) {
    keywords.push(`${dimensionsMatch[1]}x${dimensionsMatch[2]}ft ADU`)
  }

  const areaMatch = prompt.match(/Total area: ([\d,]+) square feet/)
  if (areaMatch) {
    keywords.push(`${areaMatch[1]}sqft`)
  }

  // Extract room names and types (simplified)
  const roomMatches = prompt.matchAll(/- ([^(]+) \((\w+)\):/g)
  const rooms: string[] = []
  for (const match of roomMatches) {
    if (rooms.length < 4) {
      rooms.push(match[2]) // Just the type
    }
  }
  if (rooms.length > 0) {
    keywords.push(`rooms: ${rooms.join(", ")}`)
  }

  // Extract style mentions (just the first one)
  const styleMatch = prompt.match(/Style: ([^(]+)/)
  if (styleMatch) {
    keywords.push(styleMatch[1].trim())
  }

  // Build very condensed prompt
  const condensed = `3D architectural floor plan visualization, top-down isometric view, ${keywords.join(", ")}, interior design, realistic lighting, professional render`

  console.log("[PollinationsClient] Condensed to " + condensed.length + " chars")
  return condensed
}

/**
 * Build the Pollinations image URL
 * Using gen.pollinations.ai/image/ endpoint (authenticated API)
 */
function buildImageUrl(prompt: string, options: {
  width: number
  height: number
  model: PollinationsModel
  seed?: number
}): string {
  const encodedPrompt = encodeURIComponent(prompt)

  const params = new URLSearchParams({
    width: String(options.width),
    height: String(options.height),
    model: options.model,
  })

  if (options.seed !== undefined) {
    params.set("seed", String(options.seed))
  }

  // Use gen.pollinations.ai/image/ endpoint (authenticated API)
  return `https://gen.pollinations.ai/image/${encodedPrompt}?${params.toString()}`
}

/**
 * Try to fetch an image with a specific model
 */
async function tryFetchImage(
  url: string,
  timeoutMs: number
): Promise<{ success: boolean; buffer?: Buffer; mimeType?: string; error?: string }> {
  if (!POLLINATIONS_API_KEY) {
    return { success: false, error: "POLLINATIONS_API_KEY not configured" }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "image/jpeg, image/png, image/*",
        "Authorization": `Bearer ${POLLINATIONS_API_KEY}`,
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      }
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Check if we got an actual image (should be > 1KB)
    if (buffer.length < 1000) {
      return {
        success: false,
        error: "Response too small - likely not an image",
      }
    }

    const contentType = response.headers.get("content-type") || "image/jpeg"
    const mimeType = contentType.split(";")[0].trim()

    return { success: true, buffer, mimeType }
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof Error && error.name === "AbortError") {
      return { success: false, error: "Timeout" }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Generate an image using Pollinations AI with retry logic
 */
export async function generateImage(options: GenerateImageOptions): Promise<GenerateImageResult> {
  const prompt = condensePrompt(options.prompt)

  const width = options.width || (options.quality === "final" ? 1024 : 768)
  const height = options.height || (options.quality === "final" ? 768 : 576)

  // Generate a random seed for variety
  const seed = options.seed ?? Math.floor(Math.random() * 1000000)

  console.log("[PollinationsClient] Generating image...")
  console.log("[PollinationsClient] Prompt:", prompt.substring(0, 100) + "...")

  // Try each model in the fallback chain
  for (const model of MODEL_FALLBACK_CHAIN) {
    const url = buildImageUrl(prompt, { width, height, model, seed })
    console.log("[PollinationsClient] Trying model:", model)
    console.log("[PollinationsClient] URL length:", url.length)

    // Try with 45 second timeout per model
    const result = await tryFetchImage(url, 45000)

    if (result.success && result.buffer) {
      console.log("[PollinationsClient] Success with model:", model)
      console.log("[PollinationsClient] Image size:", Math.round(result.buffer.length / 1024), "KB")

      return {
        success: true,
        imageUrl: url,
        imageBase64: result.buffer.toString("base64"),
        mimeType: result.mimeType,
      }
    }

    console.log("[PollinationsClient] Model", model, "failed:", result.error)
  }

  // All models failed
  return {
    success: false,
    error: "All Pollinations models failed. The service may be overloaded. Please try again later.",
  }
}

/**
 * Get just the URL (for preview)
 */
export function getImageUrl(options: GenerateImageOptions): string {
  const prompt = condensePrompt(options.prompt)
  const width = options.width || 768
  const height = options.height || 576
  return buildImageUrl(prompt, { width, height, model: "turbo" })
}

/**
 * Check if Pollinations API is configured
 */
export function isPollinationsAvailable(): boolean {
  return !!POLLINATIONS_API_KEY
}
