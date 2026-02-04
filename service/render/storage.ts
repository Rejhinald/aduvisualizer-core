/**
 * Local Storage for Renders
 *
 * Saves generated renders to the local filesystem
 * Later can be swapped for Cloudflare R2 or other cloud storage
 */

import { mkdir, writeFile } from "fs/promises"
import { join, dirname } from "path"
import { existsSync } from "fs"

// Local storage directory (relative to project root)
const STORAGE_DIR = process.env.RENDER_STORAGE_DIR || "./storage/renders"

// Base URL for serving files (in development, served by the API)
const STORAGE_BASE_URL = process.env.RENDER_STORAGE_URL || "http://localhost:3001/renders"

/**
 * Ensure directory exists
 */
async function ensureDir(filePath: string): Promise<void> {
  const dir = dirname(filePath)
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }
}

/**
 * Save render to local storage
 */
export async function saveRenderToLocal(
  filename: string,
  base64Data: string,
  mimeType: string
): Promise<string> {
  const filePath = join(STORAGE_DIR, filename)
  await ensureDir(filePath)

  // Convert base64 to buffer and save
  const buffer = Buffer.from(base64Data, "base64")
  await writeFile(filePath, buffer)

  console.log(`[Storage] Saved render to ${filePath} (${buffer.length} bytes)`)
  return filePath
}

/**
 * Get URL for a stored render
 */
export function getRenderUrl(filename: string): string {
  return `${STORAGE_BASE_URL}/${filename}`
}

/**
 * Get local file path for a render
 */
export function getRenderPath(filename: string): string {
  return join(STORAGE_DIR, filename)
}
