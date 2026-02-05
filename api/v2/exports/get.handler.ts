import { Context } from "hono"
import { db } from "../../../config/db"
import { exports as exportsTable } from "../../../schema"
import { eq } from "drizzle-orm"
import { successResponse, failedResponse } from "../../../utils/response/helpers"

/**
 * GET /api/v2/exports/:exportId
 * Get an export record
 */
export async function getExportHandler(c: Context) {
  try {
    const exportId = c.req.param("exportId")
    if (!exportId) {
      return c.json(failedResponse(c, { message: "Export ID is required" }), 400)
    }

    const [exportRecord] = await db
      .select()
      .from(exportsTable)
      .where(eq(exportsTable.id, exportId))
      .limit(1)

    if (!exportRecord) {
      return c.json(failedResponse(c, { message: "Export not found" }), 404)
    }

    return c.json(successResponse(c, { data: exportRecord, message: "Export retrieved" }))
  } catch (error) {
    console.error("Error getting export:", error)
    return c.json(failedResponse(c, { message: "Failed to get export" }), 500)
  }
}
