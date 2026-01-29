export type PaginationMeta = {
  total: number
  limit: number
  page: number
  pages: number
  prev: boolean
  next: boolean
}

export type LogMeta = {
  requestId: string
  timestamp: string
  level: string
}

export type ApiResponse<T> = {
  status: "success" | "error"
  message: string
  data: T
  error: Record<string, unknown> | unknown[]
  meta: {
    pagination: PaginationMeta | null
  }
  log: LogMeta
}
