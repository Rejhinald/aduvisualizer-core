import { Hono } from "hono"
import { createSnapshotHandler } from "./create.handler"
import { listSnapshotsHandler } from "./list.handler"
import { getSnapshotHandler } from "./get.handler"
import { restoreSnapshotHandler } from "./restore.handler"
import { deleteSnapshotHandler } from "./delete.handler"

export const snapshotsRouter = new Hono()

// POST /api/v2/snapshots - Create a snapshot
snapshotsRouter.post("/", createSnapshotHandler)

// GET /api/v2/snapshots/blueprint/:blueprintId - List snapshots for a blueprint
snapshotsRouter.get("/blueprint/:blueprintId", listSnapshotsHandler)

// GET /api/v2/snapshots/:snapshotId - Get a snapshot
snapshotsRouter.get("/:snapshotId", getSnapshotHandler)

// POST /api/v2/snapshots/:snapshotId/restore - Restore blueprint from snapshot
snapshotsRouter.post("/:snapshotId/restore", restoreSnapshotHandler)

// DELETE /api/v2/snapshots/:snapshotId - Delete a snapshot
snapshotsRouter.delete("/:snapshotId", deleteSnapshotHandler)
