import { Context } from "hono"
import { db } from "../../../config/db"
import { exports as exportsTable } from "../../../schema"
import { eq, desc } from "drizzle-orm"
import { successResponse, failedResponse } from "../../../utils/response/helpers"

/**
 * GET /api/v2/exports/blueprint/:blueprintId
 * List all exports for a blueprint (newest first)
 */
export async function listExportsHandler(c: Context) {
  try {
    const blueprintId = c.req.param("blueprintId")
    if (!blueprintId) {
      return c.json(failedResponse(c, { message: "Blueprint ID is required" }), 400)
    }

    const result = await db
      .select()
      .from(exportsTable)
      .where(eq(exportsTable.blueprintId, blueprintId))
      .orderBy(desc(exportsTable.createdAt))

    return c.json(successResponse(c, { data: result, message: "Exports retrieved" }))
  } catch (error) {
    console.error("Error listing exports:", error)
    return c.json(failedResponse(c, { message: "Failed to list exports" }), 500)
  }
}
