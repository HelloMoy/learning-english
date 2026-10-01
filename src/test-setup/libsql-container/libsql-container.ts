import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
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
 * Starts a fresh libSQL server in a container and applies migrations.
 *
 * @param options.throughMigration - Stop after the migration with this tag
 *   (e.g. `0002_learner_rewards`), to seed data an older schema held before
 *   calling {@link applyAllMigrations}. Every migration is applied when omitted.
 * @returns The migrated database and a `stop` that removes the container
 */
export async function startLibsqlContainer(
  options: { throughMigration?: string } = {},
): Promise<StartedLibsql> {
  const container = await new GenericContainer(LIBSQL_IMAGE)
    .withExposedPorts(LIBSQL_PORT)
    .withWaitStrategy(Wait.forHttp("/health", LIBSQL_PORT))
    .start();
  const url = urlOf(container);
  const database = createDatabase({ url });
  const migrationsFolder = options.throughMigration
    ? migrationsThrough(options.throughMigration)
    : MIGRATIONS_FOLDER;
  await migrate(database, { migrationsFolder });

  return { database, url, stop: async () => void (await container.stop()) };
}

/**
 * Applies every migration not yet applied — the rest of the history after a
 * container started with `throughMigration`.
 *
 * @param database - A database migrated by {@link startLibsqlContainer}
 */
export async function applyAllMigrations(database: Database): Promise<void> {
  await migrate(database, { migrationsFolder: MIGRATIONS_FOLDER });
}

type Journal = { entries: Array<{ tag: string }> };

// Drizzle reads the history from `meta/_journal.json`, so a copy whose journal
// ends at `tag` is a migrations folder that stops there.
function migrationsThrough(tag: string): string {
  const journal = JSON.parse(
    readFileSync(path.join(MIGRATIONS_FOLDER, "meta/_journal.json"), "utf8"),
  ) as Journal;
  const last = journal.entries.findIndex((entry) => entry.tag === tag);
  if (last === -1) throw new Error(`No migration tagged ${tag}`);
  const entries = journal.entries.slice(0, last + 1);

  const folder = mkdtempSync(path.join(tmpdir(), "migrations-"));
  mkdirSync(path.join(folder, "meta"));
  writeFileSync(path.join(folder, "meta/_journal.json"), JSON.stringify({ ...journal, entries }));
  for (const entry of entries) {
    const file = `${entry.tag}.sql`;
    copyFileSync(path.join(MIGRATIONS_FOLDER, file), path.join(folder, file));
  }
  return folder;
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
