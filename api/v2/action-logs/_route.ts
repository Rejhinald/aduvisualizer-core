import { Hono } from "hono"
import { listActionLogsHandler } from "./list.handler"
import { getActionLogHandler } from "./get.handler"

export const actionLogsRouter = new Hono()

// GET /api/v2/action-logs/blueprint/:blueprintId - List action logs for a blueprint
actionLogsRouter.get("/blueprint/:blueprintId", listActionLogsHandler)

// GET /api/v2/action-logs/:logId - Get a specific action log
actionLogsRouter.get("/:logId", getActionLogHandler)

// Note: Action logs are created automatically by other handlers (create/update/delete)
// They should not be created directly via API
