/**
 * Run SQL migration script
 */
import { readFileSync } from "fs";
import { sql as pgSql } from "../config/db";

async function runMigration() {
  console.log("Running finishes schema migration...");

  try {
    // Read the SQL file
    const sqlContent = readFileSync("./drizzle/migrate-finishes.sql", "utf-8");

    // Split into individual statements and execute
    const statements = sqlContent
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith("--"));

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 60)}...`);
      await pgSql.unsafe(statement);
    }

    console.log("✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }

  await pgSql.end();
  process.exit(0);
}

runMigration();
