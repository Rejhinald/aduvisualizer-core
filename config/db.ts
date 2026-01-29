import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { env } from "../utils/env/load"
import * as schema from "../schema"

// Build connection string
function getConnectionString(): string {
  // Priority: DB_URI > DATABASE_URL > constructed URL
  if (env.DB_URI) {
    return env.DB_URI
  }

  if (env.DATABASE_URL) {
    return env.DATABASE_URL
  }

  // Construct from individual parts
  return `postgresql://${env.DB_USER}:${env.DB_PASS}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`
}

const connectionString = getConnectionString()

// Check if SSL is needed (e.g., for cloud databases)
const isSSL = connectionString.includes("sslmode=require") ||
              connectionString.includes(".neon.") ||
              connectionString.includes(".supabase.") ||
              connectionString.includes(".railway.")

// Create postgres client
export const sql = postgres(connectionString, {
  max: 10,  // Connection pool size
  ssl: isSSL ? { rejectUnauthorized: false } : false,
})

// Create Drizzle ORM instance
export const db = drizzle(sql, { schema })

// Test database connection
export async function initDb(): Promise<boolean> {
  try {
    const res = await sql`SELECT 1 as ok`
    console.log("✅ Database connected successfully")
    return true
  } catch (err) {
    console.error("❌ Database connection failed:", err)
    return false
  }
}

// Close database connection (for graceful shutdown)
export async function closeDb(): Promise<void> {
  await sql.end()
  console.log("Database connection closed")
}
