import { z } from "zod"

export const envSchema = z.object({
  // Core App
  ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3001),
  APP_NAME: z.string().default("aduvisualizer-core"),
  APP_VERSION: z.string().default("1.0.0"),

  // API Config
  API_VERSION: z.string().default("v1"),
  API_PREFIX: z.string().default("/api"),
  BASE_HOST: z.string().default("localhost"),

  // Database
  DB_ENGINE: z.string().default("postgresql"),
  DB_NAME: z.string().default("aduvisualizer"),
  DB_USER: z.string().default("postgres"),
  DB_PASS: z.string().default("postgres"),
  DB_HOST: z.string().default("localhost"),
  DB_PORT: z.coerce.number().default(5432),
  DB_URI: z.string().optional(),
  DATABASE_URL: z.string().optional(),

  // Pagination
  DEFAULT_PER_PAGE: z.coerce.number().default(20),
  MAX_PER_PAGE: z.coerce.number().default(100),

  // JWT Auth
  JWT_ACCESS_SECRET_KEY: z.string().default("adu-access-secret-change-me"),
  JWT_REFRESH_SECRET_KEY: z.string().default("adu-refresh-secret-change-me"),
  JWT_ACCESS_EXPIRATION: z.string().default("15m"),
  JWT_REFRESH_EXPIRATION: z.string().default("7d"),

  // Cookies
  AUTH_REFRESH_COOKIE_NAME: z.string().default("adu_refresh_token"),
  AUTH_ACCESS_COOKIE_NAME: z.string().default("adu_access_token"),
  AUTH_CSRF_COOKIE_NAME: z.string().default("adu_csrf_token"),
  AUTH_CSRF_HEADER_NAME: z.string().default("x-csrf-token"),

  // CORS
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  CORS_CREDENTIALS: z.coerce.boolean().default(true),

  // Logging
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),

  // Google Maps API (for satellite imagery)
  GOOGLE_MAPS_API_KEY: z.string().optional(),

  // Nano Banana AI (for 3D visualization)
  NANOBANANA_API_KEY: z.string().optional(),
  NANOBANANA_API_URL: z.string().default("https://api.nanobanana.ai/v1"),
})

export type Env = z.infer<typeof envSchema>
