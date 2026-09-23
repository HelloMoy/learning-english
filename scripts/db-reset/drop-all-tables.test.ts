// @vitest-environment node
import {
  DOCKER_AVAILABLE,
  startLibsqlContainer,
  type StartedLibsql,
} from "@/test-setup/libsql-container/libsql-container";

import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { dropAllTables } from "./drop-all-tables";

describe.skipIf(!DOCKER_AVAILABLE)("dropAllTables (integration)", () => {
  let libsql: StartedLibsql;

  beforeAll(async () => {
    libsql = await startLibsqlContainer();
  }, 180_000);

  afterAll(async () => {
    await libsql?.stop();
  });

  test("leaves a migrated database with no tables, the migration journal included", async () => {
    await dropAllTables(libsql.database);

    const tables = await libsql.database.all<{ name: string }>(
      sql`select name from sqlite_master where type = 'table' and name not like 'sqlite_%'`,
    );
    expect(tables).toEqual([]);
  });
});
