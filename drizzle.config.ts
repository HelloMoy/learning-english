import { existsSync } from "node:fs";

import { defineConfig } from "drizzle-kit";

// drizzle-kit runs outside Next.js, so nothing has loaded the env files yet.
// Same precedence as Next: `.env.local` wins over `.env`.
for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}

/**
 * Drizzle Kit configuration: where the schema lives, where generated
 * migrations go, and which database `db:migrate` / `db:studio` talk to.
 *
 * `dialect: "turso"` speaks libSQL, so the same config reaches the Compose
 * server (`http://127.0.0.1:8081`) and Turso Cloud (`libsql://…`).
 */
export default defineConfig({
  schema: "./src/adapters/persistence/turso/schema/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  casing: "snake_case",
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL ?? "http://127.0.0.1:8081",
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
});
