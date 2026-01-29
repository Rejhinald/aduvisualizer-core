import type { Context } from "hono"
import type { ApiResponse, PaginationMeta, LogMeta } from "./types"

function getLogMeta(c: Context, level: string = "info"): LogMeta {
  return {
    requestId: (c.get("requestId") as string) ?? crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    level,
  }
}

export function successResponse<T>(
  c: Context,
  opts: {
    data?: T
    message: string
    level?: string
    meta?: { pagination: PaginationMeta | null }
  }
): ApiResponse<T> {
  return {
    status: "success",
    message: opts.message,
    data: opts.data as T,
    error: {},
    meta: opts.meta ?? { pagination: null },
    log: getLogMeta(c, opts.level ?? "info"),
  }
}

export function failedResponse(
  c: Context,
  opts: {
    message: string
    error?: Record<string, unknown> | unknown[]
    level?: string
  }
): ApiResponse<[]> {
  return {
    status: "error",
    message: opts.message,
    data: [],
    error: opts.error ?? {},
    meta: { pagination: null },
    log: getLogMeta(c, opts.level ?? "error"),
  }
}

export function successListResponse<T>(
  c: Context,
  opts: {
    data: T[]
    message: string
    pagination: PaginationMeta
    level?: string
  }
): ApiResponse<T[]> {
  return {
    status: "success",
    message: opts.message,
    data: opts.data,
    error: {},
    meta: { pagination: opts.pagination },
    log: getLogMeta(c, opts.level ?? "info"),
  }
}

/**
 * Format Zod validation errors into a flat object
 */
export function formatZodErrors(err: unknown): Record<string, string[]> {
  if (!err || typeof err !== "object" || !("issues" in err)) return {}
  const zodErr = err as { issues: Array<{ path: (string | number)[]; message: string }> }
  const out: Record<string, string[]> = {}
  for (const issue of zodErr.issues) {
    const key = String(issue.path?.[0] ?? "_error")
    out[key] = out[key] ?? []
    if (!out[key].includes(issue.message)) {
      out[key].push(issue.message)
    }
  }
  return out
}
