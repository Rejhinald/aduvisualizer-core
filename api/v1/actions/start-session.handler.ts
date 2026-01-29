import type { Context } from "hono"
import { db } from "../../../config/db"
import { editorSessions } from "../../../schema"
import { successResponse, failedResponse, formatZodErrors } from "../../../utils/response/helpers"
import { z } from "zod"

const StartSessionSchema = z.object({
  projectId: z.string().uuid(),
  blueprintId: z.string().uuid().optional(),
})

/**
 * Start a new editor session
 * POST /api/v1/actions/sessions
 */
export async function startSessionHandler(c: Context) {
  try {
    const body = await c.req.json()
    const parsed = StartSessionSchema.safeParse(body)

    if (!parsed.success) {
      return c.json(
        failedResponse(c, {
          message: "Validation failed",
          error: formatZodErrors(parsed.error),
        }),
        400
      )
    }

    const { projectId, blueprintId } = parsed.data

    // Get client info
    const ipAddress = c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown"
    const userAgent = c.req.header("user-agent") || "unknown"

    // Create new session
    const [session] = await db
      .insert(editorSessions)
      .values({
        projectId,
        blueprintId,
        ipAddress,
        userAgent,
        status: "active",
        actionCount: 0,
      })
      .returning()

    // Log session start to terminal
    console.log(`\n[Session] ✓ Started: ${session.id}`)
    console.log(`  Project: ${projectId}${blueprintId ? ` | Blueprint: ${blueprintId}` : ''}`)

    return c.json(
      successResponse(c, {
        data: {
          sessionId: session.id,
          projectId: session.projectId,
          blueprintId: session.blueprintId,
          startedAt: session.startedAt,
        },
        message: "Editor session started",
      }),
      201
    )
  } catch (e) {
    console.error("Start session error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to start session",
        error: { message: String(e) },
      }),
      500
    )
  }
}
