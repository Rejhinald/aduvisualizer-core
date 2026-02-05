import { db } from "../config/db"
import { actionLogs } from "../schema"

type ActionType = "create" | "update" | "delete"
type EntityType = "corner" | "wall" | "door" | "window" | "furniture" | "lot" | "blueprint"

/**
 * Log an action to the action_logs table
 * Used for audit trail and undo/redo functionality
 */
export async function logAction(params: {
  blueprintId: string
  actionType: ActionType
  entityType: EntityType
  entityId?: string
  beforeState?: unknown
  afterState?: unknown
}) {
  try {
    await db.insert(actionLogs).values({
      blueprintId: params.blueprintId,
      actionType: params.actionType,
      entityType: params.entityType,
      entityId: params.entityId,
      beforeState: params.beforeState,
      afterState: params.afterState,
    })
  } catch (error) {
    // Log error but don't fail the main operation
    console.error("Failed to log action:", error)
  }
}
