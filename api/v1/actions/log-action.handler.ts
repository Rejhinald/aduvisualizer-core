import type { Context } from "hono"
import { db } from "../../../config/db"
import { actionLogs, editorSessions } from "../../../schema"
import { successResponse, failedResponse, formatZodErrors } from "../../../utils/response/helpers"
import { z } from "zod"
import { eq, sql } from "drizzle-orm"

const LogActionSchema = z.object({
  sessionId: z.string().uuid(),
  action: z.string().max(100), // e.g., "room.move", "window.resize", "furniture.rotate"
  entityType: z.enum(["room", "door", "window", "furniture", "boundary"]),
  entityId: z.string().uuid().optional(),

  // State changes
  previousState: z.record(z.string(), z.unknown()).optional(),
  newState: z.record(z.string(), z.unknown()).optional(),

  // Common position/dimension fields for quick queries
  positionX: z.number().int().optional(),
  positionY: z.number().int().optional(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  rotation: z.number().int().optional(),
})

/**
 * Log a single editor action
 * POST /api/v1/actions/log
 */
export async function logActionHandler(c: Context) {
  try {
    const body = await c.req.json()
    const parsed = LogActionSchema.safeParse(body)

    if (!parsed.success) {
      return c.json(
        failedResponse(c, {
          message: "Validation failed",
          error: formatZodErrors(parsed.error),
        }),
        400
      )
    }

    const data = parsed.data

    // Get session info to populate projectId/blueprintId
    const [session] = await db
      .select()
      .from(editorSessions)
      .where(eq(editorSessions.id, data.sessionId))
      .limit(1)

    if (!session || session.status !== "active") {
      return c.json(
        failedResponse(c, {
          message: "Session not found or inactive",
          error: { sessionId: data.sessionId },
        }),
        404
      )
    }

    // Get request metadata
    const requestId = c.get("requestId") as string || crypto.randomUUID()
    const ipAddress = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown"
    const userAgent = c.req.header("user-agent") || "unknown"

    // Insert action log
    const [actionLog] = await db
      .insert(actionLogs)
      .values({
        sessionId: data.sessionId,
        projectId: session.projectId,
        blueprintId: session.blueprintId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        previousState: data.previousState,
        newState: data.newState,
        positionX: data.positionX,
        positionY: data.positionY,
        width: data.width,
        height: data.height,
        rotation: data.rotation,
        requestId,
        ipAddress,
        userAgent,
      })
      .returning()

    // Update session activity
    await db
      .update(editorSessions)
      .set({
        lastActivityAt: new Date(),
        actionCount: sql`${editorSessions.actionCount} + 1`,
      })
      .where(eq(editorSessions.id, data.sessionId))

    // Log action to terminal for visibility
    console.log(`\n[ActionLog] Session: ${data.sessionId.slice(0, 8)}... | ${data.action} (${data.entityType}${data.entityId ? ': ' + data.entityId.slice(0, 8) : ''})`)
    if (data.previousState) console.log(`  prev: ${JSON.stringify(data.previousState)}`)
    if (data.newState) console.log(`  new:  ${JSON.stringify(data.newState)}`)

    return c.json(
      successResponse(c, {
        data: {
          id: actionLog.id,
          action: actionLog.action,
          entityType: actionLog.entityType,
          createdAt: actionLog.createdAt,
        },
        message: "Action logged",
      }),
      201
    )
  } catch (e) {
    console.error("Log action error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to log action",
        error: { message: String(e) },
      }),
      500
    )
  }
}
