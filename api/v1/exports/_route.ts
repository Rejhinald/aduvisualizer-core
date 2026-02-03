import { Hono } from "hono"
import { createPdfHandler } from "./create-pdf.handler"
import { listExportsHandler } from "./list.handler"
import { getExportHandler } from "./get.handler"

export const exportsRouter = new Hono()

// PDF generation (server-side)
exportsRouter.post("/pdf", createPdfHandler)

// Track client-side exports (PNG, JSON)
exportsRouter.post("/track", createPdfHandler) // Reuse handler with different format

// List exports for a blueprint
exportsRouter.get("/", listExportsHandler)

// Get specific export details
exportsRouter.get("/:exportId", getExportHandler)
