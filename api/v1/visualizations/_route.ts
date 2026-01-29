import { Hono } from "hono"
import { generateVisualizationHandler } from "./generate.handler"
import { getVisualizationHandler } from "./get.handler"
import { listVisualizationsHandler } from "./list.handler"

export const visualizationsRouter = new Hono()

// Generate a new visualization
visualizationsRouter.post("/generate", generateVisualizationHandler)

// Get visualization by ID
visualizationsRouter.get("/:id", getVisualizationHandler)

// List visualizations for a blueprint
visualizationsRouter.get("/blueprint/:blueprintId", listVisualizationsHandler)
