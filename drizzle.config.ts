import { defineConfig } from "drizzle-kit"
import { config } from "dotenv"

config()

// Build connection string
function getConnectionString(): string {
  if (process.env.DB_URI) {
    return process.env.DB_URI
  }
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }
  const user = process.env.DB_USER ?? "postgres"
  const pass = process.env.DB_PASS ?? "postgres"
  const host = process.env.DB_HOST ?? "localhost"
  const port = process.env.DB_PORT ?? "5432"
  const name = process.env.DB_NAME ?? "aduvisualizer"
  return `postgresql://${user}:${pass}@${host}:${port}/${name}`
}

export default defineConfig({
  schema: "./schema",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: getConnectionString(),
  },
  verbose: true,
  strict: true,
})
