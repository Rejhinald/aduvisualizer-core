/**
 * Server-side PDF Generator for Blueprint Export
 * Uses pdfkit to generate professional architectural blueprints
 */

import PDFDocument from "pdfkit"
import {
  SHEET_CONFIGS,
  SCALE_OPTIONS,
  BLUEPRINT_COLORS,
  LEGEND_ITEMS,
  FONT_SIZES,
  inchesToPoints,
  formatFeetInches,
} from "./constants"
import type { ExportSettingsInput, BlueprintSnapshotInput } from "../../types/export"

interface GeneratePDFOptions {
  canvasImage: string // Base64 encoded PNG from Konva
  lotOverlayImage?: string // Base64 encoded PNG
  satelliteImage?: string // Base64 encoded PNG
  blueprintData: BlueprintSnapshotInput
  settings: ExportSettingsInput
}

interface PageInfo {
  number: number
  total: number
  title: string
}

/**
 * Generate a professional blueprint PDF
 */
export async function generateBlueprintPDF(options: GeneratePDFOptions): Promise<Buffer> {
  const { canvasImage, lotOverlayImage, satelliteImage, blueprintData, settings } = options
  const sheet = SHEET_CONFIGS[settings.sheetSize] || SHEET_CONFIGS.LETTER

  // Create PDF - sheet dimensions are already in landscape (width > height)
  // Do NOT use layout: "landscape" as it would swap them back to portrait
  const doc = new PDFDocument({
    size: [inchesToPoints(sheet.widthInches), inchesToPoints(sheet.heightInches)],
    margin: inchesToPoints(sheet.marginInches),
    info: {
      Title: `${settings.projectName} - Blueprint`,
      Author: settings.preparedBy || "ADU Visualizer",
      Subject: "Architectural Floor Plan",
      Creator: "ADU Visualizer Export",
    },
  })

  // Collect chunks
  const chunks: Buffer[] = []
  doc.on("data", (chunk) => chunks.push(chunk))

  // Calculate page count
  let pageCount = 1
  if (settings.includeSchedules) pageCount++
  if (settings.includeLotOverlay && lotOverlayImage) pageCount++
  if (settings.includeSatellite && satelliteImage) pageCount++

  // Page 1: Floor Plan
  await renderFloorPlanPage(doc, canvasImage, blueprintData, settings, sheet, {
    number: 1,
    total: pageCount,
    title: "FLOOR PLAN",
  })

  // Page 2: Schedules (if enabled)
  if (settings.includeSchedules) {
    doc.addPage()
    renderSchedulesPage(doc, blueprintData, settings, sheet, {
      number: 2,
      total: pageCount,
      title: "SCHEDULES",
    })
  }

  // Page 3: Lot Overlay (if enabled and available)
  if (settings.includeLotOverlay && lotOverlayImage) {
    doc.addPage()
    await renderImagePage(doc, lotOverlayImage, settings, sheet, {
      number: settings.includeSchedules ? 3 : 2,
      total: pageCount,
      title: "LOT OVERLAY",
    })
  }

  // Page 4: Satellite View (if enabled and available)
  if (settings.includeSatellite && satelliteImage) {
    doc.addPage()
    await renderImagePage(doc, satelliteImage, settings, sheet, {
      number: pageCount,
      total: pageCount,
      title: "SATELLITE VIEW",
    })
  }

  doc.end()

  return new Promise((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)
  })
}

/**
 * Render the main floor plan page
 */
async function renderFloorPlanPage(
  doc: PDFKit.PDFDocument,
  canvasImage: string,
  data: BlueprintSnapshotInput,
  settings: ExportSettingsInput,
  sheet: typeof SHEET_CONFIGS.LETTER,
  pageInfo: PageInfo
): Promise<void> {
  const margin = inchesToPoints(sheet.marginInches)
  const titleBlockHeight = inchesToPoints(sheet.titleBlockHeight)
  const pageWidth = inchesToPoints(sheet.widthInches)
  const pageHeight = inchesToPoints(sheet.heightInches)

  // Drawing area dimensions
  const drawingWidth = pageWidth - margin * 2
  const drawingHeight = pageHeight - margin * 2 - titleBlockHeight

  // Draw border around entire content area
  doc
    .rect(margin, margin, drawingWidth, drawingHeight + titleBlockHeight)
    .stroke()

  // Draw separator line above title block
  doc
    .moveTo(margin, pageHeight - margin - titleBlockHeight)
    .lineTo(pageWidth - margin, pageHeight - margin - titleBlockHeight)
    .stroke()

  // Add canvas image
  try {
    const imgData = canvasImage.replace(/^data:image\/\w+;base64,/, "")
    const imgBuffer = Buffer.from(imgData, "base64")

    // Fit image in drawing area with some padding
    const imagePadding = inchesToPoints(0.25)
    doc.image(imgBuffer, margin + imagePadding, margin + imagePadding, {
      fit: [drawingWidth - imagePadding * 2, drawingHeight - imagePadding * 2],
      align: "center",
      valign: "center",
    })
  } catch (error) {
    // If image fails, add placeholder text
    doc
      .fontSize(FONT_SIZES.title)
      .text("Floor Plan Image", margin + 20, margin + drawingHeight / 2, {
        width: drawingWidth - 40,
        align: "center",
      })
  }

  // Add title block
  if (settings.includeTitleBlock) {
    renderTitleBlock(doc, settings, sheet, pageInfo)
  }

  // Add north arrow
  if (settings.includeNorthArrow) {
    renderNorthArrow(doc, sheet)
  }

  // Add legend
  if (settings.includeLegend) {
    renderLegend(doc, sheet)
  }

  // Add scale bar
  renderScaleBar(doc, settings, sheet)
}

/**
 * Render the title block at the bottom of the page
 */
function renderTitleBlock(
  doc: PDFKit.PDFDocument,
  settings: ExportSettingsInput,
  sheet: typeof SHEET_CONFIGS.LETTER,
  pageInfo: PageInfo
): void {
  const margin = inchesToPoints(sheet.marginInches)
  const titleBlockHeight = inchesToPoints(sheet.titleBlockHeight)
  const pageWidth = inchesToPoints(sheet.widthInches)
  const pageHeight = inchesToPoints(sheet.heightInches)

  const titleBlockY = pageHeight - margin - titleBlockHeight
  const titleBlockWidth = pageWidth - margin * 2

  // Divide title block into columns
  const col1Width = titleBlockWidth * 0.45 // Project info
  const col2Width = titleBlockWidth * 0.30 // Drawing info
  const col3Width = titleBlockWidth * 0.25 // Sheet number

  const col1X = margin
  const col2X = margin + col1Width
  const col3X = col2X + col2Width

  // Draw column dividers
  doc
    .moveTo(col2X, titleBlockY)
    .lineTo(col2X, pageHeight - margin)
    .stroke()
  doc
    .moveTo(col3X, titleBlockY)
    .lineTo(col3X, pageHeight - margin)
    .stroke()

  // Column 1: Project Name and Address
  doc
    .fontSize(FONT_SIZES.title)
    .font("Helvetica-Bold")
    .text(settings.projectName || "ADU Floor Plan", col1X + 10, titleBlockY + 15, {
      width: col1Width - 20,
    })

  doc
    .fontSize(FONT_SIZES.body)
    .font("Helvetica")
    .text(settings.address || "Address not specified", col1X + 10, titleBlockY + 40, {
      width: col1Width - 20,
    })

  // Column 2: Drawing Info
  const col2Y = titleBlockY + 10
  const lineHeight = 18

  doc.fontSize(FONT_SIZES.small).font("Helvetica")
  doc.text("SCALE:", col2X + 10, col2Y)
  doc.font("Helvetica-Bold")
  const scaleLabel = SCALE_OPTIONS.find((s) => s.value === settings.scale)?.label || settings.scale
  doc.text(scaleLabel, col2X + 50, col2Y)

  doc.font("Helvetica")
  doc.text("DATE:", col2X + 10, col2Y + lineHeight)
  doc.font("Helvetica-Bold")
  doc.text(new Date().toLocaleDateString(), col2X + 50, col2Y + lineHeight)

  doc.font("Helvetica")
  doc.text("PREPARED BY:", col2X + 10, col2Y + lineHeight * 2)
  doc.font("Helvetica-Bold")
  doc.text(settings.preparedBy || "—", col2X + 80, col2Y + lineHeight * 2)

  // Column 3: Sheet Number
  doc
    .fontSize(FONT_SIZES.label)
    .font("Helvetica-Bold")
    .text("SHEET", col3X + 20, titleBlockY + 10)

  doc
    .fontSize(24)
    .text(`A-${pageInfo.number}`, col3X + 20, titleBlockY + 28)

  doc
    .fontSize(FONT_SIZES.body)
    .font("Helvetica")
    .text(pageInfo.title, col3X + 20, titleBlockY + 60)

  doc
    .fontSize(FONT_SIZES.tiny)
    .text(`${pageInfo.number} of ${pageInfo.total}`, col3X + 20, titleBlockY + 78)
}

/**
 * Render north arrow in top-right corner
 */
function renderNorthArrow(doc: PDFKit.PDFDocument, sheet: typeof SHEET_CONFIGS.LETTER): void {
  const margin = inchesToPoints(sheet.marginInches)
  const pageWidth = inchesToPoints(sheet.widthInches)

  const arrowX = pageWidth - margin - 40
  const arrowY = margin + 40
  const arrowSize = 20

  // Draw arrow
  doc.save()
  doc
    .moveTo(arrowX, arrowY - arrowSize)
    .lineTo(arrowX - arrowSize * 0.4, arrowY + arrowSize * 0.3)
    .lineTo(arrowX, arrowY)
    .lineTo(arrowX + arrowSize * 0.4, arrowY + arrowSize * 0.3)
    .closePath()
    .fill("#000000")

  // "N" label
  doc
    .fontSize(FONT_SIZES.label)
    .font("Helvetica-Bold")
    .text("N", arrowX - 5, arrowY - arrowSize - 15)
  doc.restore()
}

/**
 * Render legend in top-right area
 */
function renderLegend(doc: PDFKit.PDFDocument, sheet: typeof SHEET_CONFIGS.LETTER): void {
  const margin = inchesToPoints(sheet.marginInches)
  const pageWidth = inchesToPoints(sheet.widthInches)

  const legendX = pageWidth - margin - 130
  const legendY = margin + 70
  const lineHeight = 14

  doc
    .fontSize(FONT_SIZES.small)
    .font("Helvetica-Bold")
    .text("LEGEND", legendX, legendY)

  doc.font("Helvetica").fontSize(FONT_SIZES.tiny)

  LEGEND_ITEMS.forEach((item, index) => {
    const y = legendY + 15 + index * lineHeight

    // Draw symbol
    doc.save()
    const symbolColor = item.color || "#000000"

    // Convert hex to RGB for pdfkit
    const r = parseInt(symbolColor.slice(1, 3), 16)
    const g = parseInt(symbolColor.slice(3, 5), 16)
    const b = parseInt(symbolColor.slice(5, 7), 16)

    doc.strokeColor([r, g, b])

    if (item.symbol.includes("dashed")) {
      doc.dash(3, { space: 2 })
    }
    doc.lineWidth(item.symbol.includes("thick") ? 2 : 1)
    doc
      .moveTo(legendX, y + 4)
      .lineTo(legendX + 20, y + 4)
      .stroke()
    doc.undash()
    doc.restore()

    // Draw label
    doc.fillColor("#000000").text(item.label, legendX + 25, y)
  })
}

/**
 * Render scale bar at bottom-left
 */
function renderScaleBar(
  doc: PDFKit.PDFDocument,
  settings: ExportSettingsInput,
  sheet: typeof SHEET_CONFIGS.LETTER
): void {
  const margin = inchesToPoints(sheet.marginInches)
  const titleBlockHeight = inchesToPoints(sheet.titleBlockHeight)
  const pageHeight = inchesToPoints(sheet.heightInches)

  const barX = margin + 20
  const barY = pageHeight - margin - titleBlockHeight - 25
  const barWidth = 100
  const barHeight = 8
  const segments = 5

  // Draw scale bar segments
  for (let i = 0; i < segments; i++) {
    const x = barX + (i * barWidth) / segments
    const width = barWidth / segments

    if (i % 2 === 0) {
      doc.rect(x, barY, width, barHeight).fill("#000000")
    } else {
      doc.rect(x, barY, width, barHeight).stroke()
    }
  }

  // Labels
  doc.fontSize(FONT_SIZES.tiny).font("Helvetica")
  doc.text("0", barX - 3, barY + barHeight + 3)
  doc.text("5'-0\"", barX + barWidth - 10, barY + barHeight + 3)
  doc.text("SCALE BAR", barX, barY - 12)
}

/**
 * Render schedules page
 */
function renderSchedulesPage(
  doc: PDFKit.PDFDocument,
  data: BlueprintSnapshotInput,
  settings: ExportSettingsInput,
  sheet: typeof SHEET_CONFIGS.LETTER,
  pageInfo: PageInfo
): void {
  const margin = inchesToPoints(sheet.marginInches)
  const titleBlockHeight = inchesToPoints(sheet.titleBlockHeight)
  const pageWidth = inchesToPoints(sheet.widthInches)
  const pageHeight = inchesToPoints(sheet.heightInches)

  // Draw border
  const contentWidth = pageWidth - margin * 2
  const contentHeight = pageHeight - margin * 2 - titleBlockHeight
  doc.rect(margin, margin, contentWidth, contentHeight + titleBlockHeight).stroke()
  doc
    .moveTo(margin, pageHeight - margin - titleBlockHeight)
    .lineTo(pageWidth - margin, pageHeight - margin - titleBlockHeight)
    .stroke()

  let currentY = margin + 20

  // Page title
  doc.fontSize(FONT_SIZES.title).font("Helvetica-Bold").text("SCHEDULES", margin + 20, currentY)
  currentY += 30

  // Room Schedule
  currentY = renderScheduleTable(
    doc,
    "ROOM SCHEDULE",
    ["ROOM", "TYPE", "AREA (SF)"],
    data.rooms.map((r) => [r.name, r.type.toUpperCase(), `${Math.round(r.area)}`]),
    margin + 20,
    currentY,
    contentWidth - 40
  )
  currentY += 20

  // Door Schedule
  if (data.doors.length > 0) {
    // Aggregate doors by type
    const doorCounts: Record<string, { type: string; width: number; count: number }> = {}
    data.doors.forEach((d, i) => {
      const key = `${d.type}-${d.width}`
      if (!doorCounts[key]) {
        doorCounts[key] = { type: d.type, width: d.width, count: 0 }
      }
      doorCounts[key].count++
    })

    currentY = renderScheduleTable(
      doc,
      "DOOR SCHEDULE",
      ["MARK", "TYPE", "WIDTH", "QTY"],
      Object.values(doorCounts).map((d, i) => [
        `D${i + 1}`,
        d.type.toUpperCase().replace("_", " "),
        formatFeetInches(d.width),
        `${d.count}`,
      ]),
      margin + 20,
      currentY,
      contentWidth - 40
    )
    currentY += 20
  }

  // Window Schedule
  if (data.windows.length > 0) {
    const windowCounts: Record<string, { type: string; width: number; height: number; count: number }> = {}
    data.windows.forEach((w) => {
      const key = `${w.type}-${w.width}-${w.height}`
      if (!windowCounts[key]) {
        windowCounts[key] = { type: w.type, width: w.width, height: w.height, count: 0 }
      }
      windowCounts[key].count++
    })

    currentY = renderScheduleTable(
      doc,
      "WINDOW SCHEDULE",
      ["MARK", "TYPE", "W x H", "QTY"],
      Object.values(windowCounts).map((w, i) => [
        `W${i + 1}`,
        w.type.toUpperCase().replace("_", " "),
        `${formatFeetInches(w.width)} x ${formatFeetInches(w.height)}`,
        `${w.count}`,
      ]),
      margin + 20,
      currentY,
      contentWidth - 40
    )
    currentY += 20
  }

  // Furniture Schedule
  if (data.furniture.length > 0) {
    const furnitureCounts: Record<string, { type: string; width: number; height: number; count: number }> = {}
    data.furniture.forEach((f) => {
      const key = f.type
      if (!furnitureCounts[key]) {
        furnitureCounts[key] = { type: f.type, width: f.width, height: f.height, count: 0 }
      }
      furnitureCounts[key].count++
    })

    renderScheduleTable(
      doc,
      "FURNITURE SCHEDULE",
      ["ITEM", "DIMENSIONS", "QTY"],
      Object.values(furnitureCounts).map((f) => [
        f.type.replace(/-/g, " ").toUpperCase(),
        `${formatFeetInches(f.width)} x ${formatFeetInches(f.height)}`,
        `${f.count}`,
      ]),
      margin + 20,
      currentY,
      contentWidth - 40
    )
  }

  // Title block
  if (settings.includeTitleBlock) {
    renderTitleBlock(doc, settings, sheet, pageInfo)
  }
}

/**
 * Render a schedule table
 */
function renderScheduleTable(
  doc: PDFKit.PDFDocument,
  title: string,
  headers: string[],
  rows: string[][],
  x: number,
  y: number,
  maxWidth: number
): number {
  const colWidth = maxWidth / headers.length
  const rowHeight = 18
  const headerHeight = 20

  // Title
  doc.fontSize(FONT_SIZES.label).font("Helvetica-Bold").text(title, x, y)
  y += 15

  // Header row
  doc.rect(x, y, maxWidth, headerHeight).fillAndStroke("#f0f0f0", "#000000")

  doc.fillColor("#000000").fontSize(FONT_SIZES.small).font("Helvetica-Bold")
  headers.forEach((header, i) => {
    doc.text(header, x + i * colWidth + 5, y + 5, { width: colWidth - 10 })
  })
  y += headerHeight

  // Data rows
  doc.font("Helvetica").fontSize(FONT_SIZES.small)
  rows.forEach((row) => {
    doc.rect(x, y, maxWidth, rowHeight).stroke()
    row.forEach((cell, i) => {
      doc.text(cell, x + i * colWidth + 5, y + 4, { width: colWidth - 10 })
    })
    y += rowHeight
  })

  return y
}

/**
 * Render a page with just an image (lot overlay or satellite)
 */
async function renderImagePage(
  doc: PDFKit.PDFDocument,
  imageBase64: string,
  settings: ExportSettingsInput,
  sheet: typeof SHEET_CONFIGS.LETTER,
  pageInfo: PageInfo
): Promise<void> {
  const margin = inchesToPoints(sheet.marginInches)
  const titleBlockHeight = inchesToPoints(sheet.titleBlockHeight)
  const pageWidth = inchesToPoints(sheet.widthInches)
  const pageHeight = inchesToPoints(sheet.heightInches)

  const contentWidth = pageWidth - margin * 2
  const contentHeight = pageHeight - margin * 2 - titleBlockHeight

  // Draw border
  doc.rect(margin, margin, contentWidth, contentHeight + titleBlockHeight).stroke()
  doc
    .moveTo(margin, pageHeight - margin - titleBlockHeight)
    .lineTo(pageWidth - margin, pageHeight - margin - titleBlockHeight)
    .stroke()

  // Add image
  try {
    const imgData = imageBase64.replace(/^data:image\/\w+;base64,/, "")
    const imgBuffer = Buffer.from(imgData, "base64")

    const imagePadding = inchesToPoints(0.25)
    doc.image(imgBuffer, margin + imagePadding, margin + imagePadding, {
      fit: [contentWidth - imagePadding * 2, contentHeight - imagePadding * 2],
      align: "center",
      valign: "center",
    })
  } catch (error) {
    doc
      .fontSize(FONT_SIZES.title)
      .text("Image could not be loaded", margin + 20, margin + contentHeight / 2, {
        width: contentWidth - 40,
        align: "center",
      })
  }

  // Title block
  if (settings.includeTitleBlock) {
    renderTitleBlock(doc, settings, sheet, pageInfo)
  }
}

/**
 * Calculate page count for export
 */
export function calculatePageCount(settings: ExportSettingsInput, hasLotImage: boolean, hasSatelliteImage: boolean): number {
  let count = 1 // Floor plan page
  if (settings.includeSchedules) count++
  if (settings.includeLotOverlay && hasLotImage) count++
  if (settings.includeSatellite && hasSatelliteImage) count++
  return count
}
