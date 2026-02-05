import { Hono } from "hono"
import { createDoorHandler } from "./create.handler"
import { listDoorsHandler } from "./list.handler"
import { updateDoorHandler } from "./update.handler"
import { deleteDoorHandler } from "./delete.handler"

export const doorsRouter = new Hono()

// POST /api/v2/doors - Create a door
doorsRouter.post("/", createDoorHandler)

// GET /api/v2/doors/wall/:wallId - List doors on a wall
doorsRouter.get("/wall/:wallId", listDoorsHandler)

// PATCH /api/v2/doors/:doorId - Update a door
doorsRouter.patch("/:doorId", updateDoorHandler)

// DELETE /api/v2/doors/:doorId - Delete a door
doorsRouter.delete("/:doorId", deleteDoorHandler)
