import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";

import { createDatabase, type Database } from "@/adapters/persistence/turso/database/database";
import { user } from "@/adapters/persistence/turso/schema/schema";

import { migrate } from "drizzle-orm/libsql/migrator";
import { GenericContainer, Wait, type StartedTestContainer } from "testcontainers";

/**
 * The libSQL server image every database suite runs. `compose.yaml` pins the
 * same tag — a test keeps them equal, so a suite never passes against an
 * engine development does not run.
 */
export const LIBSQL_IMAGE = "ghcr.io/tursodatabase/libsql-server:v0.24.32";

const LIBSQL_PORT = 8080;
const MIGRATIONS_FOLDER = path.resolve(__dirname, "../../../drizzle");

/**
 * Whether this machine can start containers. Database suites skip rather than
 * fail without it, as the S3 and GCS blob-store suites do, so `pnpm test:run`
 * still passes on a laptop without Docker.
 */
export const DOCKER_AVAILABLE = (() => {
  try {
    execSync("docker info", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
})();

/** A running, migrated libSQL server and the Drizzle client that reaches it. */
export type StartedLibsql = {
  database: Database;
  url: string;
  stop: () => Promise<void>;
};

/**
 * Starts a fresh libSQL server in a container and applies every migration.
 *
 * @returns The migrated database and a `stop` that removes the container
 */
export async function startLibsqlContainer(): Promise<StartedLibsql> {
  const container = await new GenericContainer(LIBSQL_IMAGE)
    .withExposedPorts(LIBSQL_PORT)
    .withWaitStrategy(Wait.forHttp("/health", LIBSQL_PORT))
    .start();
  const url = urlOf(container);
  const database = createDatabase({ url });
  await migrate(database, { migrationsFolder: MIGRATIONS_FOLDER });

  return { database, url, stop: async () => void (await container.stop()) };
}

function urlOf(container: StartedTestContainer): string {
  return `http://${container.getHost()}:${container.getMappedPort(LIBSQL_PORT)}`;
}

/**
 * Inserts a user row, the parent every learner row needs.
 *
 * @param database - A migrated database
 * @returns The new user's id
 */
export async function insertTestUser(database: Database): Promise<string> {
  const id = randomUUID();
  await database.insert(user).values({ id, name: "Test Learner", email: `${id}@example.com` });
  return id;
}
