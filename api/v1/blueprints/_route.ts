import { Hono } from "hono"
import { saveFullBlueprintHandler } from "./save-full.handler"
import { getBlueprintHandler } from "./get.handler"
import { getBlueprintWithGeoHandler } from "./get-with-geo.handler"
import { listBlueprintsHandler } from "./list.handler"

export const blueprintsRouter = new Hono()

// Save complete blueprint (rooms, doors, windows, furniture)
blueprintsRouter.post("/save", saveFullBlueprintHandler)

// Get blueprint by ID
blueprintsRouter.get("/:id", getBlueprintHandler)

// Get blueprint with geo-converted coordinates (for satellite overlay)
blueprintsRouter.get("/:id/geo", getBlueprintWithGeoHandler)

// List blueprints for a project
blueprintsRouter.get("/project/:projectId", listBlueprintsHandler)
