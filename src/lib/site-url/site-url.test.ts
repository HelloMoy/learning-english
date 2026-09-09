import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { siteUrl } from "./site-url";

/**
 * Guards the `site-metadata` capability's "resolves one absolute site URL"
 * requirement.
 *
 * The failure this protects against is silent: with no valid origin, Next
 * emits `og:image` and `og:url` as relative paths. Nothing throws, the page
 * renders, and every crawler drops the image. So the precedence order and the
 * loud failure both get their own case.
 */

const OWNED = [
  "NEXT_PUBLIC_SITE_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
  "VERCEL_URL",
  "PORT",
] as const;

let saved: Partial<Record<(typeof OWNED)[number], string | undefined>> = {};

beforeEach(() => {
  saved = Object.fromEntries(OWNED.map((key) => [key, process.env[key]]));
  for (const key of OWNED) delete process.env[key];
});

afterEach(() => {
  for (const key of OWNED) {
    const value = saved[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("siteUrl", () => {
  test("prefers an explicit NEXT_PUBLIC_SITE_URL over every Vercel variable", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://english-course.online";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "production.vercel.app";
    process.env.VERCEL_URL = "preview.vercel.app";

    expect(siteUrl()).toBe("https://english-course.online");
  });

  test("falls back to the Vercel production domain", () => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "english-course.vercel.app";
    process.env.VERCEL_URL = "preview-abc123.vercel.app";

    expect(siteUrl()).toBe("https://english-course.vercel.app");
  });

  test("falls back to the current deployment so a preview describes itself", () => {
    process.env.VERCEL_URL = "preview-abc123.vercel.app";

    expect(siteUrl()).toBe("https://preview-abc123.vercel.app");
  });

  test("falls back to localhost on the port the server actually bound", () => {
    process.env.PORT = "3001";

    expect(siteUrl()).toBe("http://localhost:3001");
  });

  test("falls back to localhost:3000 when no port is declared", () => {
    expect(siteUrl()).toBe("http://localhost:3000");
  });

  test("refuses a malformed site URL instead of falling through to the next candidate", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "english-course.online";
    process.env.VERCEL_URL = "preview-abc123.vercel.app";

    expect(() => siteUrl()).toThrow(/NEXT_PUBLIC_SITE_URL/);
    expect(() => siteUrl()).toThrow(/english-course\.online/);
  });

  test("drops a trailing slash so callers can concatenate a pathname", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://english-course.online/";

    expect(siteUrl()).toBe("https://english-course.online");
  });
});
