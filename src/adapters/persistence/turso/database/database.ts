import "server-only";

import { serverEnv } from "@/lib/server-env/server-env";

import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";

import * as schema from "../schema/schema";

/**
 * Where a libSQL database lives: an `http://` URL (the Compose server), a
 * `libsql://` URL (Turso Cloud, which needs `authToken`), or a `file:` URL.
 *
 * @category Persistence
 */
export type DatabaseLocation = {
  url: string;
  authToken?: string;
};

/**
 * The application's Drizzle client, typed with the full schema.
 *
 * @category Persistence
 */
export type Database = LibSQLDatabase<typeof schema>;

/**
 * Builds a Drizzle client over `@libsql/client` for one database.
 *
 * @remarks
 * Adapters receive the result as a constructor argument rather than importing
 * a shared instance, so a test hands them a database of its own. The
 * process-wide instance the app uses is built once in `getDatabase()`.
 *
 * @param location - The database URL and, for Turso Cloud, its token
 * @returns A Drizzle client that knows every application table
 */
export function createDatabase(location: DatabaseLocation): Database {
  return drizzle({ connection: location, schema, casing: "snake_case" });
}

let processDatabase: Database | undefined;

/**
 * The one Drizzle client this server process uses, built on first call from
 * the validated environment (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`).
 *
 * @returns The process-wide database
 * @throws Error naming the variable when the environment is invalid
 */
export function getDatabase(): Database {
  const { TURSO_DATABASE_URL, TURSO_AUTH_TOKEN } = serverEnv();
  processDatabase ??= createDatabase({ url: TURSO_DATABASE_URL, authToken: TURSO_AUTH_TOKEN });
  return processDatabase;
}
