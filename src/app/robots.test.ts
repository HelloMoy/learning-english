import { afterEach, beforeEach, describe, expect, test } from "vitest";

import robots from "./robots";

/**
 * Guards the `search-discoverability` capability's "only the production
 * deployment invites crawling" requirement.
 *
 * The failure this prevents is silent and slow: a Vercel preview is a
 * byte-for-byte duplicate of production under a different hostname, and an
 * indexed preview competes with the site it was built to check. Nothing in the
 * running app shows that happening.
 */
const OWNED = ["VERCEL_ENV", "NEXT_PUBLIC_SITE_URL", "VERCEL_URL", "PORT"] as const;

let saved: Partial<Record<(typeof OWNED)[number], string | undefined>> = {};

beforeEach(() => {
  saved = Object.fromEntries(OWNED.map((key) => [key, process.env[key]]));
  for (const key of OWNED) delete process.env[key];
  process.env.NEXT_PUBLIC_SITE_URL = "https://english-course.online";
});

afterEach(() => {
  for (const key of OWNED) {
    const value = saved[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("robots", () => {
  test("invites crawlers on production and names the sitemap", () => {
    process.env.VERCEL_ENV = "production";

    const policy = robots();

    expect(policy.rules).toMatchObject({ userAgent: "*", allow: "/" });
    expect(policy.rules).not.toHaveProperty("disallow");
    expect(policy.sitemap).toBe("https://english-course.online/sitemap.xml");
  });

  test.each(["preview", "development"])("refuses crawlers on a %s deployment", (environment) => {
    process.env.VERCEL_ENV = environment;

    const policy = robots();

    expect(policy.rules).toMatchObject({ userAgent: "*", disallow: "/" });
  });

  test("refuses crawlers when the environment is unknown, rather than guessing", () => {
    const policy = robots();

    expect(policy.rules).toMatchObject({ userAgent: "*", disallow: "/" });
  });
});
