import type { Context } from "hono"
import { db } from "../../../config/db"
import { editorSessions } from "../../../schema"
import { successResponse, failedResponse } from "../../../utils/response/helpers"
import { eq } from "drizzle-orm"

/**
 * End an editor session
 * POST /api/v1/actions/sessions/:sessionId/end
 */
export async function endSessionHandler(c: Context) {
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

    // Get and verify session exists
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

    if (session.status === "closed") {
      return c.json(
        successResponse(c, {
          data: {
            sessionId: session.id,
            status: session.status,
            actionCount: session.actionCount,
            closedAt: session.closedAt,
          },
          message: "Session already closed",
        }),
        200
      )
    }

    // Close the session
    const [updatedSession] = await db
      .update(editorSessions)
      .set({
        status: "closed",
        closedAt: new Date(),
      })
      .where(eq(editorSessions.id, sessionId))
      .returning()

    // Log session end to terminal
    const duration = updatedSession.closedAt && updatedSession.startedAt
      ? Math.round((updatedSession.closedAt.getTime() - updatedSession.startedAt.getTime()) / 1000)
      : null
    console.log(`\n[Session] ✗ Ended: ${sessionId}`)
    console.log(`  Actions logged: ${updatedSession.actionCount}${duration ? ` | Duration: ${duration}s` : ''}`)

    return c.json(
      successResponse(c, {
        data: {
          sessionId: updatedSession.id,
          status: updatedSession.status,
          actionCount: updatedSession.actionCount,
          startedAt: updatedSession.startedAt,
          closedAt: updatedSession.closedAt,
          duration: updatedSession.closedAt && updatedSession.startedAt
            ? Math.round((updatedSession.closedAt.getTime() - updatedSession.startedAt.getTime()) / 1000)
            : null,
        },
        message: "Session ended",
      }),
      200
    )
  } catch (e) {
    console.error("End session error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to end session",
        error: { message: String(e) },
      }),
      500
    )
  }
}
