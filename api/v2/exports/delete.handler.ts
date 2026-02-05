import { Context } from "hono"
import { db } from "../../../config/db"
import { exports as exportsTable } from "../../../schema"
import { eq } from "drizzle-orm"
import { successResponse, failedResponse } from "../../../utils/response/helpers"

/**
 * DELETE /api/v2/exports/:exportId
 * Delete an export record
 */
export async function deleteExportHandler(c: Context) {
  try {
    const exportId = c.req.param("exportId")
    if (!exportId) {
      return c.json(failedResponse(c, { message: "Export ID is required" }), 400)
    }

    const [deleted] = await db
      .delete(exportsTable)
      .where(eq(exportsTable.id, exportId))
      .returning()

    if (!deleted) {
      return c.json(failedResponse(c, { message: "Export not found" }), 404)
    }

    // TODO: If filePath exists, delete the file from storage

    return c.json(successResponse(c, { data: { id: deleted.id }, message: "Export deleted" }))
  } catch (error) {
    console.error("Error deleting export:", error)
    return c.json(failedResponse(c, { message: "Failed to delete export" }), 500)
  }
}
