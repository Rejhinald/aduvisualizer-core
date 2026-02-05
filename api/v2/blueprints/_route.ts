import { Hono } from "hono"
import { saveBlueprintHandler } from "./save.handler"
import { getBlueprintHandler, getBlueprintByProjectHandler } from "./get.handler"

// Import corner handlers
import { createCornerHandler, listCornersHandler } from "../corners/_route"
import { updateCornerHandler } from "../corners/update.handler"
import { deleteCornerHandler } from "../corners/delete.handler"

// Import wall handlers
import { createWallHandler, listWallsHandler } from "../walls/_route"
import { updateWallHandler } from "../walls/update.handler"
import { deleteWallHandler } from "../walls/delete.handler"

export const blueprintsRouterV2 = new Hono()

// ============================================
// Blueprint Core Routes
// ============================================

// POST /blueprints/save - Save complete blueprint
blueprintsRouterV2.post("/save", saveBlueprintHandler)

// GET /blueprints/project/:projectId - Get blueprint for a project (must come before /:blueprintId)
blueprintsRouterV2.get("/project/:projectId", getBlueprintByProjectHandler)

// GET /blueprints/:blueprintId - Get blueprint with computed rooms
blueprintsRouterV2.get("/:blueprintId", getBlueprintHandler)

// ============================================
// Corner CRUD Routes (nested under blueprint)
// ============================================

// POST /blueprints/:blueprintId/corners - Create corner
blueprintsRouterV2.post("/:blueprintId/corners", createCornerHandler)

// GET /blueprints/:blueprintId/corners - List corners
blueprintsRouterV2.get("/:blueprintId/corners", listCornersHandler)

// PATCH /blueprints/corners/:cornerId - Update corner
blueprintsRouterV2.patch("/corners/:cornerId", updateCornerHandler)

// DELETE /blueprints/corners/:cornerId - Delete corner
blueprintsRouterV2.delete("/corners/:cornerId", deleteCornerHandler)

// ============================================
// Wall CRUD Routes (nested under blueprint)
// ============================================

// POST /blueprints/:blueprintId/walls - Create wall
blueprintsRouterV2.post("/:blueprintId/walls", createWallHandler)

// GET /blueprints/:blueprintId/walls - List walls
blueprintsRouterV2.get("/:blueprintId/walls", listWallsHandler)

// PATCH /blueprints/walls/:wallId - Update wall
blueprintsRouterV2.patch("/walls/:wallId", updateWallHandler)

// DELETE /blueprints/walls/:wallId - Delete wall
blueprintsRouterV2.delete("/walls/:wallId", deleteWallHandler)
