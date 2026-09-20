// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";

import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import {
  DOCKER_AVAILABLE,
  LIBSQL_IMAGE,
  startLibsqlContainer,
  type StartedLibsql,
} from "./libsql-container";

/**
 * Guards the `learner-database` capability: database suites run against the
 * same libSQL engine developers run in Compose, with every migration applied.
 */
describe("LIBSQL_IMAGE", () => {
  test("is the image compose.yaml runs, so tests and development share one engine", () => {
    const compose = readFileSync(path.resolve(__dirname, "../../../compose.yaml"), "utf8");

    expect(compose).toContain(`image: ${LIBSQL_IMAGE}`);
  });
});

describe.skipIf(!DOCKER_AVAILABLE)("startLibsqlContainer (integration)", () => {
  let libsql: StartedLibsql;

  beforeAll(async () => {
    libsql = await startLibsqlContainer();
  }, 180_000);

  afterAll(async () => {
    await libsql?.stop();
  });

  test("applies every migration to a fresh database", async () => {
    const tables = await libsql.database.all<{ name: string }>(
      sql`select name from sqlite_master where type = 'table' order by name`,
    );

    expect(tables.map((table) => table.name)).toEqual(
      expect.arrayContaining(["user", "session", "account", "verification", "rate_limit"]),
    );
  });

  test("enforces foreign keys, so ON DELETE CASCADE really cascades", async () => {
    const [{ foreign_keys: enforced }] = await libsql.database.all<{ foreign_keys: number }>(
      sql`pragma foreign_keys`,
    );

    expect(enforced).toBe(1);
  });
});
