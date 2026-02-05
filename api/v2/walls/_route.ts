import { Hono } from "hono"
import { createWallHandler } from "./create.handler"
import { listWallsHandler } from "./list.handler"
import { updateWallHandler } from "./update.handler"
import { deleteWallHandler } from "./delete.handler"

export const wallsRouter = new Hono()

// Note: Create and List are nested under blueprints in the main router
// These are just the individual wall operations

// PATCH /walls/:wallId - Update wall properties
wallsRouter.patch("/:wallId", updateWallHandler)

// DELETE /walls/:wallId - Delete wall (and its doors/windows)
wallsRouter.delete("/:wallId", deleteWallHandler)

// Export handlers for use in blueprints router
export { createWallHandler, listWallsHandler }
