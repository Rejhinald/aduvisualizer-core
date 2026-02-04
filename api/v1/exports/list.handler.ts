import type { Context } from "hono"
import { db } from "../../../config/db"
import { blueprintExports } from "../../../schema"
import { successResponse, failedResponse } from "../../../utils/response/helpers"
import { eq, and, desc } from "drizzle-orm"

export async function listExportsHandler(c: Context) {
  try {
    const blueprintId = c.req.query("blueprintId")
    const format = c.req.query("format")
    const limit = parseInt(c.req.query("limit") || "50", 10)
    const offset = parseInt(c.req.query("offset") || "0", 10)

    if (!blueprintId) {
      return c.json(
        failedResponse(c, {
          message: "blueprintId query parameter is required",
        }),
        400
      )
    }

    // Build conditions
    const conditions = [
      eq(blueprintExports.blueprintId, blueprintId),
      eq(blueprintExports.isDeleted, false),
    ]

    if (format) {
      conditions.push(eq(blueprintExports.format, format))
    }

    // Query exports
    const exportList = await db
      .select({
        id: blueprintExports.id,
        blueprintId: blueprintExports.blueprintId,
        format: blueprintExports.format,
        fileName: blueprintExports.fileName,
        fileUrl: blueprintExports.fileUrl,
        fileSizeBytes: blueprintExports.fileSizeBytes,
        settings: blueprintExports.settings,
        pageCount: blueprintExports.pageCount,
        sheetSize: blueprintExports.sheetSize,
        scale: blueprintExports.scale,
        createdAt: blueprintExports.createdAt,
        expiresAt: blueprintExports.expiresAt,
      })
      .from(exports)
      .where(and(...conditions))
      .orderBy(desc(blueprintExports.createdAt))
      .limit(limit)
      .offset(offset)

    // Get total count
    const [{ count }] = await db
      .select({ count: db.$count(exports) })
      .from(exports)
      .where(and(...conditions))

    return c.json(
      successResponse(c, {
        data: {
          exports: exportList,
          total: count,
          limit,
          offset,
        },
        message: "Exports retrieved successfully",
      })
    )
  } catch (e) {
    console.error("List exports error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to list exports",
        error: { message: String(e) },
      }),
      500
    )
  }
}
