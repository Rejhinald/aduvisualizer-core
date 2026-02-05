import { Hono } from "hono"
import { createFurnitureHandler } from "./create.handler"
import { listFurnitureHandler } from "./list.handler"
import { updateFurnitureHandler } from "./update.handler"
import { deleteFurnitureHandler } from "./delete.handler"

export const furnitureRouter = new Hono()

// POST /api/v2/furniture - Create furniture
furnitureRouter.post("/", createFurnitureHandler)

// GET /api/v2/furniture/blueprint/:blueprintId - List furniture in a blueprint
furnitureRouter.get("/blueprint/:blueprintId", listFurnitureHandler)

// PATCH /api/v2/furniture/:furnitureId - Update furniture
furnitureRouter.patch("/:furnitureId", updateFurnitureHandler)

// DELETE /api/v2/furniture/:furnitureId - Delete furniture
furnitureRouter.delete("/:furnitureId", deleteFurnitureHandler)
