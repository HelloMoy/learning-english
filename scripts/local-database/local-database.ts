import { existsSync } from "node:fs";

import type { Database } from "@/adapters/persistence/turso/database/database";
import * as schema from "@/adapters/persistence/turso/schema/schema";

import { drizzle } from "drizzle-orm/libsql";

/**
 * Opens the database the env files point at, for the `db:*` scripts.
 *
 * @remarks
 * Scripts run under `tsx`, outside Next.js: nothing has loaded `.env.local`
 * yet, and the app's own `getDatabase()` is `server-only`. Same precedence as
 * Next — `.env.local` wins over `.env`.
 *
 * @returns A Drizzle client for `TURSO_DATABASE_URL`, or the Compose server
 */
export function openLocalDatabase(): Database {
  for (const file of [".env.local", ".env"]) {
    if (existsSync(file)) process.loadEnvFile(file);
  }
  return drizzle({
    connection: {
      url: process.env.TURSO_DATABASE_URL ?? "http://127.0.0.1:8081",
      authToken: process.env.TURSO_AUTH_TOKEN,
    },
    schema,
    casing: "snake_case",
  });
}
