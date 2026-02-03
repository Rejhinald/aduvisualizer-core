import { Hono } from "hono"
import { projectsRouter } from "./projects/_route"
import { blueprintsRouter } from "./blueprints/_route"
import { visualizationsRouter } from "./visualizations/_route"
import { actionsRouter } from "./actions/_route"
import { snapshotsRouter } from "./snapshots/_route"
import { lotsRouter } from "./lots/_route"
import { exportsRouter } from "./exports/_route"

export const v1Router = new Hono()

// Health check
v1Router.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() })
})

// API routes
v1Router.route("/projects", projectsRouter)
v1Router.route("/blueprints", blueprintsRouter)
v1Router.route("/visualizations", visualizationsRouter)
v1Router.route("/actions", actionsRouter)
v1Router.route("/snapshots", snapshotsRouter)
v1Router.route("/lots", lotsRouter)
v1Router.route("/exports", exportsRouter)
