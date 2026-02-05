/**
 * Dimensioning utilities for Blueprint Engine
 * Converts between decimal feet and feet-inches display
 */

/**
 * Convert decimal feet to feet-inches string
 * @example 10.5 → "10' 6\""
 * @example 10.25 → "10' 3\""
 */
export function feetToFeetInches(feet: number): string {
  const wholeFeet = Math.floor(feet)
  const inches = Math.round((feet - wholeFeet) * 12)

  if (inches === 0) {
    return `${wholeFeet}'`
  }
  if (inches === 12) {
    return `${wholeFeet + 1}'`
  }
  return `${wholeFeet}' ${inches}"`
}

/**
 * Convert feet-inches string to decimal feet
 * @example "10' 6\"" → 10.5
 * @example "10'" → 10
 * @example "6\"" → 0.5
 */
export function feetInchesToFeet(str: string): number {
  // Normalize the string
  const normalized = str.trim().replace(/[''′]/g, "'").replace(/[""″]/g, '"')

  // Try to parse feet and inches
  const feetMatch = normalized.match(/(\d+(?:\.\d+)?)\s*['′]/)
  const inchesMatch = normalized.match(/(\d+(?:\.\d+)?)\s*["″]/)

  let feet = 0
  let inches = 0

  if (feetMatch) {
    feet = parseFloat(feetMatch[1])
  }
  if (inchesMatch) {
    inches = parseFloat(inchesMatch[1])
  }

  return feet + inches / 12
}

/**
 * Format area in square feet
 * @example 150.5 → "150.5 sq ft"
 */
export function formatArea(sqft: number): string {
  if (sqft < 10) {
    return `${sqft.toFixed(1)} sq ft`
  }
  return `${Math.round(sqft)} sq ft`
}

/**
 * Format dimension with precision
 */
export function formatFeet(feet: number, precision: number = 2): string {
  return `${feet.toFixed(precision)}'`
}

/**
 * Format dimension for display (uses feet-inches for clarity)
 */
export function formatDimension(feet: number): string {
  return feetToFeetInches(feet)
}

/**
 * Parse user input that could be feet, inches, or feet-inches
 * Handles: "10", "10'", "10' 6\"", "10.5", "10ft", "126in"
 */
export function parseUserInput(input: string): number | null {
  const normalized = input.trim().toLowerCase()

  // Handle pure number (assume feet)
  if (/^\d+(?:\.\d+)?$/.test(normalized)) {
    return parseFloat(normalized)
  }

  // Handle "ft" suffix
  if (/^\d+(?:\.\d+)?\s*ft$/.test(normalized)) {
    return parseFloat(normalized)
  }

  // Handle "in" suffix (convert to feet)
  if (/^\d+(?:\.\d+)?\s*in$/.test(normalized)) {
    return parseFloat(normalized) / 12
  }

  // Handle feet-inches notation
  if (normalized.includes("'") || normalized.includes('"')) {
    return feetInchesToFeet(normalized)
  }

  return null
}

/**
 * Round to nearest fraction of an inch
 */
export function roundToFraction(feet: number, fraction: 1 | 2 | 4 | 8 | 16 = 1): number {
  const inches = feet * 12
  const rounded = Math.round(inches * fraction) / fraction
  return rounded / 12
}
