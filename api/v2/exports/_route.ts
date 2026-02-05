import { Hono } from "hono"
import { createExportHandler } from "./create.handler"
import { listExportsHandler } from "./list.handler"
import { getExportHandler } from "./get.handler"
import { deleteExportHandler } from "./delete.handler"

export const exportsRouter = new Hono()

// POST /api/v2/exports - Create a new export (PDF or PNG)
exportsRouter.post("/", createExportHandler)

// GET /api/v2/exports/blueprint/:blueprintId - List exports for a blueprint
exportsRouter.get("/blueprint/:blueprintId", listExportsHandler)

// GET /api/v2/exports/:exportId - Get/download an export
exportsRouter.get("/:exportId", getExportHandler)

// DELETE /api/v2/exports/:exportId - Delete an export
exportsRouter.delete("/:exportId", deleteExportHandler)
