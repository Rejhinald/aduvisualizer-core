/**
 * API v2 Router
 *
 * Blueprint Engine v2 - Corner/Wall Graph Model
 * All coordinates in FEET
 */

import { Hono } from "hono"
import { blueprintsRouterV2 } from "./blueprints/_route"
import { cornersRouter } from "./corners/_route"
import { wallsRouter } from "./walls/_route"
import { doorsRouter } from "./doors/_route"
import { windowsRouter } from "./windows/_route"
import { furnitureRouter } from "./furniture/_route"
import { lotsRouterV2 } from "./lots/_route"
import { snapshotsRouter } from "./snapshots/_route"
import { actionLogsRouter } from "./action-logs/_route"
import { exportsRouter } from "./exports/_route"

export const apiRouterV2 = new Hono()

// Mount v2 routes
apiRouterV2.route("/blueprints", blueprintsRouterV2)
apiRouterV2.route("/corners", cornersRouter)
apiRouterV2.route("/walls", wallsRouter)
apiRouterV2.route("/doors", doorsRouter)
apiRouterV2.route("/windows", windowsRouter)
apiRouterV2.route("/furniture", furnitureRouter)
apiRouterV2.route("/lots", lotsRouterV2)
apiRouterV2.route("/snapshots", snapshotsRouter)
apiRouterV2.route("/action-logs", actionLogsRouter)
apiRouterV2.route("/exports", exportsRouter)

// Health check
apiRouterV2.get("/health", (c) => {
  return c.json({
    status: "ok",
    version: "v2",
    timestamp: new Date().toISOString(),
  })
})
