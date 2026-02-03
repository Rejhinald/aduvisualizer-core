/**
 * PDF Export Constants - Sheet sizes, scales, and styling
 */

export interface SheetConfig {
  name: string
  widthInches: number
  heightInches: number
  marginInches: number
  titleBlockHeight: number // Height reserved for title block in inches
}

/**
 * Standard architectural sheet sizes
 * Note: PDF uses points (1 inch = 72 points)
 */
export const SHEET_CONFIGS: Record<string, SheetConfig> = {
  ARCH_D: {
    name: 'ARCH D (24" x 36")',
    widthInches: 36,
    heightInches: 24,
    marginInches: 0.5,
    titleBlockHeight: 2.5,
  },
  ARCH_C: {
    name: 'ARCH C (18" x 24")',
    widthInches: 24,
    heightInches: 18,
    marginInches: 0.5,
    titleBlockHeight: 2,
  },
  LETTER: {
    name: 'Letter (8.5" x 11")',
    widthInches: 11,
    heightInches: 8.5,
    marginInches: 0.5,
    titleBlockHeight: 1.5,
  },
  A4: {
    name: "A4 (210mm x 297mm)",
    widthInches: 11.69,
    heightInches: 8.27,
    marginInches: 0.5,
    titleBlockHeight: 1.5,
  },
}

/**
 * Architectural scale options
 */
export const SCALE_OPTIONS = [
  { value: "1/4", label: '1/4" = 1\'-0"', pixelsPerInch: 4 },
  { value: "1/8", label: '1/8" = 1\'-0"', pixelsPerInch: 8 },
  { value: "3/16", label: '3/16" = 1\'-0"', pixelsPerInch: 5.33 },
  { value: "1/16", label: '1/16" = 1\'-0"', pixelsPerInch: 16 },
  { value: "auto", label: "Auto (fit to sheet)", pixelsPerInch: 0 },
]

/**
 * DPI options for export quality
 */
export const DPI_OPTIONS = {
  preview: 72,
  standard: 150,
  print: 300,
  highQuality: 600,
}

/**
 * Blueprint styling colors
 */
export const BLUEPRINT_COLORS = {
  boundary: "#dc2626", // ADU boundary - red
  dimensions: "#0a0a0a", // Dimension lines - black
  rooms: "#3b82f6", // Room outlines - blue
  doors: "#16a34a", // Doors - green
  windows: "#0891b2", // Windows - cyan
  furniture: "#7c3aed", // Furniture - purple
  lot: "#3b82f6", // Lot boundary - blue
  setback: "#22c55e", // Setback lines - green
  grid: "#e4e4e7", // Grid - light gray
  text: "#0a0a0a", // Text - black
  titleBlock: "#961818", // Title block accent - brand red
}

/**
 * Legend items for the blueprint
 */
export const LEGEND_ITEMS = [
  { symbol: "dashed-red", label: "ADU Boundary", color: BLUEPRINT_COLORS.boundary },
  { symbol: "solid-thick", label: "Wall", color: BLUEPRINT_COLORS.text },
  { symbol: "door-arc", label: "Door Swing", color: BLUEPRINT_COLORS.doors },
  { symbol: "window-lines", label: "Window", color: BLUEPRINT_COLORS.windows },
  { symbol: "dashed-blue", label: "Lot Boundary", color: BLUEPRINT_COLORS.lot },
  { symbol: "dashed-green", label: "Setback Line", color: BLUEPRINT_COLORS.setback },
]

/**
 * Font sizes for PDF elements (in points)
 */
export const FONT_SIZES = {
  title: 16,
  subtitle: 12,
  label: 10,
  body: 9,
  small: 8,
  tiny: 6,
}

/**
 * Convert inches to PDF points
 */
export function inchesToPoints(inches: number): number {
  return inches * 72
}

/**
 * Convert pixels to feet using pixelsPerFoot ratio
 */
export function pixelsToFeet(pixels: number, pixelsPerFoot: number): number {
  return pixels / pixelsPerFoot
}

/**
 * Format feet as feet-inches string (e.g., 10'-6")
 */
export function formatFeetInches(feet: number): string {
  const wholeFeet = Math.floor(feet)
  const inches = Math.round((feet - wholeFeet) * 12)
  if (inches === 0) {
    return `${wholeFeet}'-0"`
  }
  if (inches === 12) {
    return `${wholeFeet + 1}'-0"`
  }
  return `${wholeFeet}'-${inches}"`
}
