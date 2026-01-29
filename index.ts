import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { env } from "./utils/env/load"
import { initDb } from "./config/db"
import { v1Router } from "./api/v1/router"

// Define context variables type
type Variables = {
  requestId: string
}

// Initialize Hono app with typed variables
const app = new Hono<{ Variables: Variables }>()

// Request ID middleware
app.use("*", async (c, next) => {
  const requestId = crypto.randomUUID()
  c.set("requestId", requestId)
  c.res.headers.set("X-Request-ID", requestId)
  await next()
})

// Logger middleware
app.use("*", logger())

// CORS middleware
const corsOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim())
app.use(
  "*",
  cors({
    origin: (origin) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return "*"
      // Check against allowed origins
      if (corsOrigins.includes(origin) || corsOrigins.includes("*")) {
        return origin
      }
      return null
    },
    credentials: env.CORS_CREDENTIALS,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
    exposeHeaders: ["X-Request-ID"],
  })
)

// Health check
app.get("/", (c) => {
  return c.json({
    name: env.APP_NAME,
    version: env.APP_VERSION,
    status: "running",
    timestamp: new Date().toISOString(),
  })
})

// API routes
const API_PREFIX = env.API_PREFIX
const API_VERSION = env.API_VERSION
app.route(`${API_PREFIX}/${API_VERSION}`, v1Router)

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      status: "error",
      message: "Not Found",
      data: null,
      error: { path: c.req.path },
    },
    404
  )
})

// Error handler
app.onError((err, c) => {
  console.error("Unhandled error:", err)
  return c.json(
    {
      status: "error",
      message: "Internal Server Error",
      data: null,
      error: { message: err.message },
    },
    500
  )
})

// Start server
async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🏠 ADU Visualizer Core API                              ║
║                                                           ║
║   Store blueprints with precise coordinates               ║
║   for accurate AI visualization                           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`)

  // Initialize database
  const dbReady = await initDb()
  if (!dbReady) {
    console.error("Failed to connect to database. Exiting...")
    process.exit(1)
  }

  // Start server
  console.log(`🚀 Server starting on http://localhost:${env.PORT}`)
  console.log(`📡 API available at http://localhost:${env.PORT}${API_PREFIX}/${API_VERSION}`)
  console.log(`🗺️  Geo-coordinates ready for satellite overlay`)
  console.log(`🎨 AI prompt generation ready for Nano Banana`)
  console.log("")
  console.log("Available endpoints:")
  console.log(`  GET  ${API_PREFIX}/${API_VERSION}/health`)
  console.log(`  POST ${API_PREFIX}/${API_VERSION}/projects`)
  console.log(`  POST ${API_PREFIX}/${API_VERSION}/projects/:id/geo-location`)
  console.log(`  POST ${API_PREFIX}/${API_VERSION}/blueprints/save`)
  console.log(`  GET  ${API_PREFIX}/${API_VERSION}/blueprints/:id/geo`)
  console.log(`  POST ${API_PREFIX}/${API_VERSION}/visualizations/generate`)
  console.log("")

  Bun.serve({
    port: env.PORT,
    hostname: "0.0.0.0",
    fetch: app.fetch,
  })
}

main().catch(console.error)
