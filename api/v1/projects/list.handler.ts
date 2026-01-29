import type { Context } from "hono"
import { db } from "../../../config/db"
import { projects } from "../../../schema"
import { eq, desc } from "drizzle-orm"
import { successListResponse, failedResponse } from "../../../utils/response/helpers"
import { env } from "../../../utils/env/load"

export async function listProjectsHandler(c: Context) {
  try {
    const page = parseInt(c.req.query("page") ?? "1")
    const limit = Math.min(
      parseInt(c.req.query("limit") ?? String(env.DEFAULT_PER_PAGE)),
      env.MAX_PER_PAGE
    )
    const offset = (page - 1) * limit

    const items = await db
      .select()
      .from(projects)
      .where(eq(projects.isDeleted, false))
      .orderBy(desc(projects.createdAt))
      .limit(limit)
      .offset(offset)

    // Count total (simple approach)
    const allItems = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.isDeleted, false))
    const total = allItems.length
    const pages = Math.ceil(total / limit)

    return c.json(
      successListResponse(c, {
        data: items,
        message: "Projects retrieved successfully",
        pagination: {
          total,
          limit,
          page,
          pages,
          prev: page > 1,
          next: page < pages,
        },
      })
    )
  } catch (e) {
    console.error("List projects error:", e)
    return c.json(
      failedResponse(c, {
        message: "Failed to list projects",
        error: { message: String(e) },
      }),
      500
    )
  }
}
