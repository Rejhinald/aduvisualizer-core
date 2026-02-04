import type { Context } from "hono"
import { db } from "../../../config/db"
import { blueprintExports } from "../../../schema"
import { successResponse, failedResponse } from "../../../utils/response/helpers"
import { eq, and } from "drizzle-orm"

export async function getExportHandler(c: Context) {
  try {
    const exportId = c.req.param("exportId")

    if (!exportId) {
      return c.json(
        failedResponse(c, {
          message: "Export ID is required",
        }),
        400
      )
    }

    const [exportRecord] = await db
      .select()
      .from(exports)
      .where(and(eq(blueprintExports.id, exportId), eq(blueprintExports.isDeleted, false)))
      .limit(1)

    if (!exportRecord) {
      return c.json(
        failedResponse(c, {
          message: "Export not found",
        }),
        404
      )
    }

    return c.json(
      successResponse(c, {
        data: { export: exportRecord },
        message: "Export retrieved successfully",
      })
    )
  } catch (e) {
    console.error("Get export error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to get export",
        error: { message: String(e) },
      }),
      500
    )
  }
}
