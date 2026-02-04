import type { Context } from "hono"
import { db } from "../../../config/db"
import { blueprintExports, blueprints } from "../../../schema"
import { successResponse, failedResponse, formatZodErrors } from "../../../utils/response/helpers"
import { CreatePdfExportSchema } from "../../../types/export"
import { generateBlueprintPDF, calculatePageCount } from "../../../utils/pdf/pdf-generator"
import { eq, and } from "drizzle-orm"

export async function createPdfHandler(c: Context) {
  try {
    const body = await c.req.json()
    const parsed = CreatePdfExportSchema.safeParse(body)

    if (!parsed.success) {
      return c.json(
        failedResponse(c, {
          message: "Validation failed",
          error: formatZodErrors(parsed.error),
        }),
        400
      )
    }

    // Verify blueprint exists
    const [blueprint] = await db
      .select({ id: blueprints.id })
      .from(blueprints)
      .where(and(eq(blueprints.id, parsed.data.blueprintId), eq(blueprints.isDeleted, false)))
      .limit(1)

    if (!blueprint) {
      return c.json(
        failedResponse(c, {
          message: "Blueprint not found",
        }),
        404
      )
    }

    // Generate PDF
    const pdfBuffer = await generateBlueprintPDF({
      canvasImage: parsed.data.canvasImage,
      lotOverlayImage: parsed.data.lotOverlayImage,
      satelliteImage: parsed.data.satelliteImage,
      blueprintData: parsed.data.blueprintData,
      settings: parsed.data.settings,
    })

    // Generate filename
    const timestamp = new Date().toISOString().split("T")[0]
    const sanitizedName = parsed.data.settings.projectName.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_")
    const fileName = `${sanitizedName}_Blueprint_${timestamp}.pdf`

    // Calculate page count
    const pageCount = calculatePageCount(
      parsed.data.settings,
      !!parsed.data.lotOverlayImage,
      !!parsed.data.satelliteImage
    )

    // Save export record to database
    const [exportRecord] = await db
      .insert(blueprintExports)
      .values({
        blueprintId: parsed.data.blueprintId,
        format: "pdf",
        fileName,
        fileSizeBytes: pdfBuffer.length,
        settings: { ...parsed.data.settings, format: "pdf" },
        blueprintSnapshot: parsed.data.blueprintData,
        pageCount,
        sheetSize: parsed.data.settings.sheetSize,
        scale: parsed.data.settings.scale,
      })
      .returning()

    // Return PDF as binary response (convert Buffer to Uint8Array for Response compatibility)
    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(pdfBuffer.length),
        "X-Export-Id": exportRecord.id,
        "X-Page-Count": String(pageCount),
      },
    })
  } catch (e) {
    console.error("Create PDF export error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to generate PDF",
        error: { message: String(e) },
      }),
      500
    )
  }
}
