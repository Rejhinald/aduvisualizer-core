import { Hono } from "hono"
import { createWindowHandler } from "./create.handler"
import { listWindowsHandler } from "./list.handler"
import { updateWindowHandler } from "./update.handler"
import { deleteWindowHandler } from "./delete.handler"

export const windowsRouter = new Hono()

// POST /api/v2/windows - Create a window
windowsRouter.post("/", createWindowHandler)

// GET /api/v2/windows/wall/:wallId - List windows on a wall
windowsRouter.get("/wall/:wallId", listWindowsHandler)

// PATCH /api/v2/windows/:windowId - Update a window
windowsRouter.patch("/:windowId", updateWindowHandler)

// DELETE /api/v2/windows/:windowId - Delete a window
windowsRouter.delete("/:windowId", deleteWindowHandler)
