import { Hono } from "hono"
import { startSessionHandler } from "./start-session.handler"
import { logActionHandler } from "./log-action.handler"
import { logBatchHandler } from "./log-batch.handler"
import { endSessionHandler } from "./end-session.handler"
import { getSessionHandler, listSessionsHandler } from "./get-session.handler"

/**
 * Actions Router
 * Handles editor action logging and session management
 *
 * Endpoints:
 * - POST /sessions              - Start a new editor session
 * - POST /sessions/:id/end      - End an editor session
 * - GET  /sessions/:id          - Get session with all actions
 * - GET  /sessions/project/:id  - List sessions for a project
 * - POST /log                   - Log a single action
 * - POST /log-batch             - Log multiple actions at once
 */
export const actionsRouter = new Hono()

// Session management
actionsRouter.post("/sessions", startSessionHandler)
actionsRouter.post("/sessions/:sessionId/end", endSessionHandler)
actionsRouter.get("/sessions/:sessionId", getSessionHandler)
actionsRouter.get("/sessions/project/:projectId", listSessionsHandler)

// Action logging
actionsRouter.post("/log", logActionHandler)
actionsRouter.post("/log-batch", logBatchHandler)
