import type { Context } from "hono"
import { db } from "../../../config/db"
import { exports } from "../../../schema"
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
      eq(exports.blueprintId, blueprintId),
      eq(exports.isDeleted, false),
    ]

    if (format) {
      conditions.push(eq(exports.format, format))
    }

    // Query exports
    const exportList = await db
      .select({
        id: exports.id,
        blueprintId: exports.blueprintId,
        format: exports.format,
        fileName: exports.fileName,
        fileUrl: exports.fileUrl,
        fileSizeBytes: exports.fileSizeBytes,
        settings: exports.settings,
        pageCount: exports.pageCount,
        sheetSize: exports.sheetSize,
        scale: exports.scale,
        createdAt: exports.createdAt,
        expiresAt: exports.expiresAt,
      })
      .from(exports)
      .where(and(...conditions))
      .orderBy(desc(exports.createdAt))
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
