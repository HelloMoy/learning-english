// @vitest-environment node
import { resetServerEnvForTests } from "@/lib/server-env/server-env";

import { sql } from "drizzle-orm";
import { describe, expect, test } from "vitest";

import { createDatabase, getDatabase } from "./database";

describe("createDatabase", () => {
  test("builds a Drizzle client that reaches the given libSQL URL", async () => {
    const database = createDatabase({ url: "file::memory:" });

    const rows = await database.all<{ answer: number }>(sql`select 42 as answer`);

    expect(rows).toEqual([{ answer: 42 }]);
  });

  test("knows the application schema", () => {
    const database = createDatabase({ url: "file::memory:" });

    expect(Object.keys(database._.fullSchema)).toEqual(
      expect.arrayContaining(["user", "session", "account", "verification", "rateLimit"]),
    );
  });
});

describe("getDatabase", () => {
  test("builds one client for the process from the validated environment", () => {
    Object.assign(process.env, {
      TURSO_DATABASE_URL: "file::memory:",
      BETTER_AUTH_SECRET: "a".repeat(32),
      BETTER_AUTH_URL: "http://localhost:3000",
      GOOGLE_CLIENT_ID: "id",
      GOOGLE_CLIENT_SECRET: "secret",
      TURNSTILE_SECRET_KEY: "turnstile",
      SMTP_HOST: "127.0.0.1",
      SMTP_PORT: "1025",
      SMTP_SECURE: "false",
      EMAIL_FROM: "no-reply@example.com",
    });
    resetServerEnvForTests();

    expect(getDatabase()).toBe(getDatabase());
  });
});
