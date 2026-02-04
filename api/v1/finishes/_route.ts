import { Hono } from "hono"
import { createFinishHandler } from "./create.handler"
import { getFinishHandler } from "./get.handler"
import { updateFinishHandler } from "./update.handler"
import { updateRoomFinishHandler } from "./update-room.handler"
import { updateCameraHandler } from "./update-camera.handler"
import { applyTemplateHandler } from "./apply-template.handler"
import { getOptionsHandler } from "./options.handler"
import { generateRenderHandler, getRenderHistoryHandler, getRenderStatusHandler } from "./render.handler"

export const finishesRouter = new Hono()

// Get available options (vibes, templates, lifestyles)
finishesRouter.get("/options", getOptionsHandler)

// Render service status
finishesRouter.get("/render/status", getRenderStatusHandler)

// CRUD operations
finishesRouter.post("/", createFinishHandler)
finishesRouter.get("/blueprint/:blueprintId", getFinishHandler)
finishesRouter.put("/:finishId", updateFinishHandler)

// Specialized updates
finishesRouter.put("/:finishId/room", updateRoomFinishHandler)
finishesRouter.put("/:finishId/camera", updateCameraHandler)
finishesRouter.post("/:finishId/apply-template", applyTemplateHandler)

// Render generation
finishesRouter.post("/render", generateRenderHandler)
finishesRouter.get("/render/history/:blueprintId", getRenderHistoryHandler)
