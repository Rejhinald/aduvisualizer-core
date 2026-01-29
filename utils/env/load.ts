import { config } from "dotenv"
import { envSchema, type Env } from "./schema"

// Load .env file
config()

function loadEnv(): Env {
  const raw = {
    ENV: process.env.ENV,
    PORT: process.env.PORT,
    APP_NAME: process.env.APP_NAME,
    APP_VERSION: process.env.APP_VERSION,
    API_VERSION: process.env.API_VERSION,
    API_PREFIX: process.env.API_PREFIX,
    BASE_HOST: process.env.BASE_HOST,
    DB_ENGINE: process.env.DB_ENGINE,
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER,
    DB_PASS: process.env.DB_PASS,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_URI: process.env.DB_URI,
    DATABASE_URL: process.env.DATABASE_URL,
    DEFAULT_PER_PAGE: process.env.DEFAULT_PER_PAGE,
    MAX_PER_PAGE: process.env.MAX_PER_PAGE,
    JWT_ACCESS_SECRET_KEY: process.env.JWT_ACCESS_SECRET_KEY,
    JWT_REFRESH_SECRET_KEY: process.env.JWT_REFRESH_SECRET_KEY,
    JWT_ACCESS_EXPIRATION: process.env.JWT_ACCESS_EXPIRATION,
    JWT_REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION,
    AUTH_REFRESH_COOKIE_NAME: process.env.AUTH_REFRESH_COOKIE_NAME,
    AUTH_ACCESS_COOKIE_NAME: process.env.AUTH_ACCESS_COOKIE_NAME,
    AUTH_CSRF_COOKIE_NAME: process.env.AUTH_CSRF_COOKIE_NAME,
    AUTH_CSRF_HEADER_NAME: process.env.AUTH_CSRF_HEADER_NAME,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    CORS_CREDENTIALS: process.env.CORS_CREDENTIALS,
    LOG_LEVEL: process.env.LOG_LEVEL,
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
    NANOBANANA_API_KEY: process.env.NANOBANANA_API_KEY,
    NANOBANANA_API_URL: process.env.NANOBANANA_API_URL,
  }

  const parsed = envSchema.safeParse(raw)

  if (!parsed.success) {
    console.error("❌ Invalid environment variables:")
    console.error(parsed.error.flatten().fieldErrors)
    process.exit(1)
  }

  return parsed.data
}

export const env = loadEnv()
