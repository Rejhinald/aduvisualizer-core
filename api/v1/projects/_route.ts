import { Hono } from "hono"
import { createProjectHandler } from "./create.handler"
import { getProjectHandler } from "./get.handler"
import { listProjectsHandler } from "./list.handler"
import { updateProjectHandler } from "./update.handler"
import { deleteProjectHandler } from "./delete.handler"
import { setGeoLocationHandler } from "./set-geo-location.handler"

export const projectsRouter = new Hono()

// CRUD operations
projectsRouter.post("/", createProjectHandler)
projectsRouter.get("/", listProjectsHandler)
projectsRouter.get("/:id", getProjectHandler)
projectsRouter.put("/:id", updateProjectHandler)
projectsRouter.delete("/:id", deleteProjectHandler)

// Geo operations
projectsRouter.post("/:id/geo-location", setGeoLocationHandler)
