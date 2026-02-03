import { Hono } from "hono"
import { createSnapshotHandler } from "./create.handler"
import { listSnapshotsHandler } from "./list.handler"
import { getSnapshotHandler } from "./get.handler"
import { deleteSnapshotHandler } from "./delete.handler"

export const snapshotsRouter = new Hono()

// Create a snapshot (auto or manual)
snapshotsRouter.post("/", createSnapshotHandler)

// List snapshots for a project (with optional type filter)
snapshotsRouter.get("/project/:projectId", listSnapshotsHandler)

// Get a single snapshot
snapshotsRouter.get("/:id", getSnapshotHandler)

// Delete a snapshot
snapshotsRouter.delete("/:id", deleteSnapshotHandler)
