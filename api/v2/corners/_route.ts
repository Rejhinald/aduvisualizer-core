import { Hono } from "hono"
import { createCornerHandler } from "./create.handler"
import { listCornersHandler } from "./list.handler"
import { updateCornerHandler } from "./update.handler"
import { deleteCornerHandler } from "./delete.handler"

export const cornersRouter = new Hono()

// Note: Create and List are nested under blueprints in the main router
// These are just the individual corner operations

// PATCH /corners/:cornerId - Update corner position
cornersRouter.patch("/:cornerId", updateCornerHandler)

// DELETE /corners/:cornerId - Delete corner (fails if walls connected)
cornersRouter.delete("/:cornerId", deleteCornerHandler)

// Export handlers for use in blueprints router
export { createCornerHandler, listCornersHandler }
