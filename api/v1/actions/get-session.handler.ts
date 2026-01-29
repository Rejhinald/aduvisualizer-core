import type { Context } from "hono"
import { db } from "../../../config/db"
import { editorSessions, actionLogs } from "../../../schema"
import { successResponse, failedResponse } from "../../../utils/response/helpers"
import { eq, desc } from "drizzle-orm"

/**
 * Get session details with all actions
 * GET /api/v1/actions/sessions/:sessionId
 */
export async function getSessionHandler(c: Context) {
  try {
    const sessionId = c.req.param("sessionId")

    if (!sessionId) {
      return c.json(
        failedResponse(c, {
          message: "Session ID is required",
          error: {},
        }),
        400
      )
    }

    // Get session
    const [session] = await db
      .select()
      .from(editorSessions)
      .where(eq(editorSessions.id, sessionId))
      .limit(1)

    if (!session) {
      return c.json(
        failedResponse(c, {
          message: "Session not found",
          error: { sessionId },
        }),
        404
      )
    }

    // Get all actions for this session
    const actions = await db
      .select({
        id: actionLogs.id,
        action: actionLogs.action,
        entityType: actionLogs.entityType,
        entityId: actionLogs.entityId,
        previousState: actionLogs.previousState,
        newState: actionLogs.newState,
        positionX: actionLogs.positionX,
        positionY: actionLogs.positionY,
        width: actionLogs.width,
        height: actionLogs.height,
        rotation: actionLogs.rotation,
        createdAt: actionLogs.createdAt,
      })
      .from(actionLogs)
      .where(eq(actionLogs.sessionId, sessionId))
      .orderBy(actionLogs.createdAt)

    return c.json(
      successResponse(c, {
        data: {
          session: {
            id: session.id,
            projectId: session.projectId,
            blueprintId: session.blueprintId,
            status: session.status,
            actionCount: session.actionCount,
            startedAt: session.startedAt,
            lastActivityAt: session.lastActivityAt,
            closedAt: session.closedAt,
          },
          actions,
        },
        message: "Session retrieved",
      }),
      200
    )
  } catch (e) {
    console.error("Get session error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to get session",
        error: { message: String(e) },
      }),
      500
    )
  }
}

/**
 * List sessions for a project
 * GET /api/v1/actions/sessions/project/:projectId
 */
export async function listSessionsHandler(c: Context) {
  try {
    const projectId = c.req.param("projectId")

    if (!projectId) {
      return c.json(
        failedResponse(c, {
          message: "Project ID is required",
          error: {},
        }),
        400
      )
    }

    // Get sessions for project
    const sessions = await db
      .select({
        id: editorSessions.id,
        blueprintId: editorSessions.blueprintId,
        status: editorSessions.status,
        actionCount: editorSessions.actionCount,
        startedAt: editorSessions.startedAt,
        lastActivityAt: editorSessions.lastActivityAt,
        closedAt: editorSessions.closedAt,
      })
      .from(editorSessions)
      .where(eq(editorSessions.projectId, projectId))
      .orderBy(desc(editorSessions.startedAt))
      .limit(50)

    return c.json(
      successResponse(c, {
        data: sessions,
        message: `${sessions.length} sessions found`,
      }),
      200
    )
  } catch (e) {
    console.error("List sessions error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to list sessions",
        error: { message: String(e) },
      }),
      500
    )
  }
}
