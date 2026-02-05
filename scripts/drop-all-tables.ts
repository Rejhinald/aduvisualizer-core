/**
 * Drop all tables in the database
 * Usage: bun scripts/drop-all-tables.ts
 */

import { sql } from "drizzle-orm"
import { db } from "../config/db"

async function dropAllTables() {
  console.log("Dropping all tables...")

  try {
    // Drop all tables in public schema
    await db.execute(sql`
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
      END $$;
    `)

    console.log("All tables dropped successfully!")
  } catch (error) {
    console.error("Error dropping tables:", error)
    process.exit(1)
  }

  process.exit(0)
}

dropAllTables()
