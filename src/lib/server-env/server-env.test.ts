import { afterEach, beforeEach, describe, expect, test } from "vitest";

import {
  isAuthRateLimited,
  resetServerEnvForTests,
  SERVER_ENV_VARIABLES,
  serverEnv,
} from "./server-env";

/**
 * Guards the `learner-database` capability's "The server environment is
 * validated in one place" requirement: a missing or malformed variable must
 * fail on first use and name itself, so a misconfigured deploy says what is
 * wrong instead of failing somewhere deep inside a library.
 */

const VALID = {
  TURSO_DATABASE_URL: "http://127.0.0.1:8081",
  BETTER_AUTH_SECRET: "a".repeat(32),
  BETTER_AUTH_URL: "http://localhost:3000",
  GOOGLE_CLIENT_ID: "client-id",
  GOOGLE_CLIENT_SECRET: "client-secret",
  TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
  SMTP_HOST: "127.0.0.1",
  SMTP_PORT: "1025",
  SMTP_SECURE: "false",
  EMAIL_FROM: "English Course <no-reply@english-course.online>",
} as const;

const SENTRY = [
  "SENTRY_DSN",
  "NEXT_PUBLIC_SENTRY_DSN",
  "SENTRY_ORG",
  "SENTRY_PROJECT",
  "SENTRY_AUTH_TOKEN",
] as const;

const OWNED = [
  ...Object.keys(VALID),
  "TURSO_AUTH_TOKEN",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "AUTH_RATE_LIMIT",
  ...SENTRY,
];

let saved: Record<string, string | undefined> = {};

beforeEach(() => {
  saved = Object.fromEntries(OWNED.map((key) => [key, process.env[key]]));
  for (const key of OWNED) delete process.env[key];
  Object.assign(process.env, VALID);
  resetServerEnvForTests();
});

afterEach(() => {
  for (const key of OWNED) {
    const value = saved[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  resetServerEnvForTests();
});

describe("serverEnv", () => {
  test("parses a complete local environment", () => {
    const env = serverEnv();

    expect(env.TURSO_DATABASE_URL).toBe("http://127.0.0.1:8081");
    expect(env.SMTP_PORT).toBe(1025);
    expect(env.SMTP_SECURE).toBe(false);
    expect(env.TURSO_AUTH_TOKEN).toBeUndefined();
  });

  test("needs no Sentry variable: error reporting is off until configured", () => {
    const env = serverEnv();

    for (const name of SENTRY) expect(env[name]).toBeUndefined();
  });

  test("rejects a Sentry DSN that is not a URL", () => {
    process.env.SENTRY_DSN = "not-a-dsn";

    expect(() => serverEnv()).toThrow(/SENTRY_DSN/);
  });

  test("lists every variable it reads, for the deployment runbook", () => {
    expect(SERVER_ENV_VARIABLES).toEqual(expect.arrayContaining([...OWNED]));
    expect(SERVER_ENV_VARIABLES).toHaveLength(OWNED.length);
  });

  test("reads SMTP_SECURE=true as a boolean", () => {
    process.env.SMTP_SECURE = "true";

    expect(serverEnv().SMTP_SECURE).toBe(true);
  });

  test("names a missing variable", () => {
    delete process.env.BETTER_AUTH_SECRET;

    expect(() => serverEnv()).toThrow(/BETTER_AUTH_SECRET/);
  });

  test("names a malformed variable", () => {
    process.env.SMTP_PORT = "abc";

    expect(() => serverEnv()).toThrow(/SMTP_PORT/);
  });

  test("rejects a secret shorter than 32 characters", () => {
    process.env.BETTER_AUTH_SECRET = "short";

    expect(() => serverEnv()).toThrow(/BETTER_AUTH_SECRET/);
  });

  test("requires TURSO_AUTH_TOKEN for a remote libsql:// URL", () => {
    process.env.TURSO_DATABASE_URL = "libsql://english-course-hellomoy.turso.io";

    expect(() => serverEnv()).toThrow(/TURSO_AUTH_TOKEN/);
  });

  test("accepts a remote libsql:// URL with its token", () => {
    process.env.TURSO_DATABASE_URL = "libsql://english-course-hellomoy.turso.io";
    process.env.TURSO_AUTH_TOKEN = "token";

    expect(serverEnv().TURSO_AUTH_TOKEN).toBe("token");
  });

  test("parses once and serves the same object afterwards", () => {
    const first = serverEnv();
    process.env.SMTP_PORT = "abc";

    expect(serverEnv()).toBe(first);
  });
});

describe("isAuthRateLimited", () => {
  test.each([
    ["production", undefined, true],
    ["development", undefined, false],
    ["test", undefined, false],
    ["production", false, false],
    ["development", true, true],
  ] as const)(
    "WHEN NODE_ENV is %s and AUTH_RATE_LIMIT is %s THEN it is %s",
    (nodeEnv, flag, limited) => {
      expect(isAuthRateLimited({ AUTH_RATE_LIMIT: flag }, nodeEnv)).toBe(limited);
    },
  );
});
