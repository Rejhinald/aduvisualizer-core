/**
 * Gemini API Client for Image Generation
 *
 * Uses Google's Gemini API for generating 3D renders of floor plans
 * Documentation: https://ai.google.dev/gemini-api/docs/image-generation
 */

import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize Gemini client
const GEMINI_API_KEY = process.env.GEMINI_API_KEY

if (!GEMINI_API_KEY) {
  console.warn("[GeminiClient] GEMINI_API_KEY not set - render generation will fail")
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null

export type RenderQuality = "preview" | "final"

export interface GenerateImageOptions {
  prompt: string
  quality: RenderQuality
  aspectRatio?: "1:1" | "16:9" | "4:3"
}

export interface GenerateImageResult {
  success: boolean
  imageBase64?: string
  mimeType?: string
  error?: string
}

/**
 * Generate an image using Gemini's image generation API
 * Uses Gemini 2.5 Flash Image (aka "Nano Banana") model
 * https://ai.google.dev/gemini-api/docs/image-generation
 */
export async function generateImage(options: GenerateImageOptions): Promise<GenerateImageResult> {
  if (!genAI) {
    return {
      success: false,
      error: "Gemini API key not configured",
    }
  }

  try {
    // Use Gemini 2.5 Flash Image for image generation (Nano Banana)
    // https://ai.google.dev/gemini-api/docs/image-generation
    const model = genAI.getGenerativeModel({
      model: "gemini-3-pro-image-preview",
      generationConfig: {
        // @ts-expect-error - responseModalities is a valid config for image generation
        responseModalities: ["Text", "Image"],
      },
    })

    // Adjust prompt based on quality
    const qualityPrefix = options.quality === "final"
      ? "Generate a high-quality, photorealistic"
      : "Generate a"

    const fullPrompt = `${qualityPrefix} ${options.prompt}

Important rendering requirements:
- Use accurate architectural proportions
- Show realistic materials and textures
- Include appropriate lighting and shadows
- Maintain consistent perspective
- Render at ${options.quality === "final" ? "maximum" : "standard"} quality`

    const response = await model.generateContent(fullPrompt)
    const result = response.response

    // Extract image from response
    if (result.candidates && result.candidates[0]?.content?.parts) {
      for (const part of result.candidates[0].content.parts) {
        // Check for inline image data
        if ("inlineData" in part && part.inlineData) {
          return {
            success: true,
            imageBase64: part.inlineData.data,
            mimeType: part.inlineData.mimeType || "image/png",
          }
        }
      }
    }

    return {
      success: false,
      error: "No image generated in response",
    }
  } catch (error) {
    console.error("[GeminiClient] Image generation error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Check if Gemini is configured and available
 */
export function isGeminiAvailable(): boolean {
  return !!genAI
}
