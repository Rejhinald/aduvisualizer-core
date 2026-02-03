import { Hono } from "hono"
import { saveFullBlueprintHandler } from "./save-full.handler"
import { getBlueprintHandler } from "./get.handler"
import { getBlueprintWithGeoHandler } from "./get-with-geo.handler"
import { listBlueprintsHandler } from "./list.handler"

// Room handlers
import {
  createRoomHandler,
  listRoomsHandler,
  getRoomHandler,
  updateRoomHandler,
  deleteRoomHandler,
} from "./rooms.handler"

// Door handlers
import {
  createDoorHandler,
  listDoorsHandler,
  getDoorHandler,
  updateDoorHandler,
  deleteDoorHandler,
} from "./doors.handler"

// Window handlers
import {
  createWindowHandler,
  listWindowsHandler,
  getWindowHandler,
  updateWindowHandler,
  deleteWindowHandler,
} from "./windows.handler"

// Furniture handlers
import {
  createFurnitureHandler,
  listFurnitureHandler,
  getFurnitureHandler,
  updateFurnitureHandler,
  deleteFurnitureHandler,
  bulkCreateFurnitureHandler,
} from "./furniture.handler"

// ADU Boundary handlers
import {
  getADUBoundaryHandler,
  updateADUBoundaryHandler,
  resetADUBoundaryHandler,
  validateADUBoundaryHandler,
} from "./adu-boundary.handler"

export const blueprintsRouter = new Hono()

// ============================================
// Blueprint Core Routes
// ============================================

// Save complete blueprint (rooms, doors, windows, furniture)
blueprintsRouter.post("/save", saveFullBlueprintHandler)

// Get blueprint by ID
blueprintsRouter.get("/:id", getBlueprintHandler)

// Get blueprint with geo-converted coordinates (for satellite overlay)
blueprintsRouter.get("/:id/geo", getBlueprintWithGeoHandler)

// List blueprints for a project
blueprintsRouter.get("/project/:projectId", listBlueprintsHandler)

// ============================================
// Room CRUD Routes (nested under blueprint)
// ============================================

// POST /blueprints/:blueprintId/rooms - Create room
blueprintsRouter.post("/:blueprintId/rooms", createRoomHandler)

// GET /blueprints/:blueprintId/rooms - List rooms
blueprintsRouter.get("/:blueprintId/rooms", listRoomsHandler)

// GET /blueprints/rooms/:roomId - Get single room
blueprintsRouter.get("/rooms/:roomId", getRoomHandler)

// PATCH /blueprints/rooms/:roomId - Update room
blueprintsRouter.patch("/rooms/:roomId", updateRoomHandler)

// DELETE /blueprints/rooms/:roomId - Delete room
blueprintsRouter.delete("/rooms/:roomId", deleteRoomHandler)

// ============================================
// Door CRUD Routes (nested under blueprint)
// ============================================

// POST /blueprints/:blueprintId/doors - Create door
blueprintsRouter.post("/:blueprintId/doors", createDoorHandler)

// GET /blueprints/:blueprintId/doors - List doors
blueprintsRouter.get("/:blueprintId/doors", listDoorsHandler)

// GET /blueprints/doors/:doorId - Get single door
blueprintsRouter.get("/doors/:doorId", getDoorHandler)

// PATCH /blueprints/doors/:doorId - Update door
blueprintsRouter.patch("/doors/:doorId", updateDoorHandler)

// DELETE /blueprints/doors/:doorId - Delete door
blueprintsRouter.delete("/doors/:doorId", deleteDoorHandler)

// ============================================
// Window CRUD Routes (nested under blueprint)
// ============================================

// POST /blueprints/:blueprintId/windows - Create window
blueprintsRouter.post("/:blueprintId/windows", createWindowHandler)

// GET /blueprints/:blueprintId/windows - List windows
blueprintsRouter.get("/:blueprintId/windows", listWindowsHandler)

// GET /blueprints/windows/:windowId - Get single window
blueprintsRouter.get("/windows/:windowId", getWindowHandler)

// PATCH /blueprints/windows/:windowId - Update window
blueprintsRouter.patch("/windows/:windowId", updateWindowHandler)

// DELETE /blueprints/windows/:windowId - Delete window
blueprintsRouter.delete("/windows/:windowId", deleteWindowHandler)

// ============================================
// Furniture CRUD Routes (nested under blueprint)
// ============================================

// POST /blueprints/:blueprintId/furniture - Create furniture
blueprintsRouter.post("/:blueprintId/furniture", createFurnitureHandler)

// POST /blueprints/:blueprintId/furniture/bulk - Bulk create furniture
blueprintsRouter.post("/:blueprintId/furniture/bulk", bulkCreateFurnitureHandler)

// GET /blueprints/:blueprintId/furniture - List furniture (optional ?category= filter)
blueprintsRouter.get("/:blueprintId/furniture", listFurnitureHandler)

// GET /blueprints/furniture/:furnitureId - Get single furniture
blueprintsRouter.get("/furniture/:furnitureId", getFurnitureHandler)

// PATCH /blueprints/furniture/:furnitureId - Update furniture
blueprintsRouter.patch("/furniture/:furnitureId", updateFurnitureHandler)

// DELETE /blueprints/furniture/:furnitureId - Delete furniture
blueprintsRouter.delete("/furniture/:furnitureId", deleteFurnitureHandler)

// ============================================
// ADU Boundary Routes (nested under blueprint)
// ============================================

// GET /blueprints/:blueprintId/adu-boundary - Get ADU boundary
blueprintsRouter.get("/:blueprintId/adu-boundary", getADUBoundaryHandler)

// PUT /blueprints/:blueprintId/adu-boundary - Update ADU boundary
blueprintsRouter.put("/:blueprintId/adu-boundary", updateADUBoundaryHandler)

// POST /blueprints/:blueprintId/adu-boundary/reset - Reset ADU boundary to default
blueprintsRouter.post("/:blueprintId/adu-boundary/reset", resetADUBoundaryHandler)

// POST /blueprints/:blueprintId/adu-boundary/validate - Validate ADU boundary
blueprintsRouter.post("/:blueprintId/adu-boundary/validate", validateADUBoundaryHandler)
