import type { Context } from "hono"
import { db } from "../../../config/db"
import { actionLogs, editorSessions } from "../../../schema"
import { successResponse, failedResponse, formatZodErrors } from "../../../utils/response/helpers"
import { z } from "zod"
import { eq, sql } from "drizzle-orm"

const ActionItemSchema = z.object({
  action: z.string().max(100),
  entityType: z.enum(["room", "door", "window", "furniture", "boundary"]),
  entityId: z.string().uuid().optional(),
  previousState: z.record(z.string(), z.unknown()).optional(),
  newState: z.record(z.string(), z.unknown()).optional(),
  positionX: z.number().int().optional(),
  positionY: z.number().int().optional(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  rotation: z.number().int().optional(),
  timestamp: z.string().datetime().optional(), // Client timestamp for ordering
})

const LogBatchSchema = z.object({
  sessionId: z.string().uuid(),
  actions: z.array(ActionItemSchema).min(1).max(100), // Max 100 actions per batch
})

/**
 * Log multiple editor actions in a single request (for efficiency)
 * POST /api/v1/actions/log-batch
 */
export async function logBatchHandler(c: Context) {
  try {
    const body = await c.req.json()
    const parsed = LogBatchSchema.safeParse(body)

    if (!parsed.success) {
      return c.json(
        failedResponse(c, {
          message: "Validation failed",
          error: formatZodErrors(parsed.error),
        }),
        400
      )
    }

    const { sessionId, actions } = parsed.data

    // Get session info
    const [session] = await db
      .select()
      .from(editorSessions)
      .where(eq(editorSessions.id, sessionId))
      .limit(1)

    if (!session || session.status !== "active") {
      return c.json(
        failedResponse(c, {
          message: "Session not found or inactive",
          error: { sessionId },
        }),
        404
      )
    }

    // Get request metadata
    const requestId = c.get("requestId") as string || crypto.randomUUID()
    const ipAddress = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown"
    const userAgent = c.req.header("user-agent") || "unknown"

    // Prepare batch insert values
    const insertValues = actions.map((action) => ({
      sessionId,
      projectId: session.projectId,
      blueprintId: session.blueprintId,
      action: action.action,
      entityType: action.entityType,
      entityId: action.entityId,
      previousState: action.previousState,
      newState: action.newState,
      positionX: action.positionX,
      positionY: action.positionY,
      width: action.width,
      height: action.height,
      rotation: action.rotation,
      requestId,
      ipAddress,
      userAgent,
    }))

    // Batch insert all actions
    const insertedLogs = await db
      .insert(actionLogs)
      .values(insertValues)
      .returning({ id: actionLogs.id })

    // Update session activity with total count
    await db
      .update(editorSessions)
      .set({
        lastActivityAt: new Date(),
        actionCount: sql`${editorSessions.actionCount} + ${actions.length}`,
      })
      .where(eq(editorSessions.id, sessionId))

    // Log actions to terminal for visibility
    console.log(`\n[ActionLog] Session: ${sessionId} | Logged ${actions.length} actions:`)
    actions.forEach((action, i) => {
      console.log(`  ${i + 1}. ${action.action} (${action.entityType}${action.entityId ? ': ' + action.entityId.slice(0, 8) : ''})`)
      if (action.previousState) console.log(`     prev: ${JSON.stringify(action.previousState)}`)
      if (action.newState) console.log(`     new:  ${JSON.stringify(action.newState)}`)
    })

    return c.json(
      successResponse(c, {
        data: {
          logged: insertedLogs.length,
          sessionId,
        },
        message: `${insertedLogs.length} actions logged`,
      }),
      201
    )
  } catch (e) {
    console.error("Log batch error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to log actions",
        error: { message: String(e) },
      }),
      500
    )
  }
}
