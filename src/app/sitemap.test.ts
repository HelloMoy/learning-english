import { describe, expect, test } from "vitest";

import sitemap from "./sitemap";

/**
 * Guards `search-discoverability` § "The sitemap lists every servable URL":
 * signing in is required everywhere but the home and the two legal documents,
 * so those three are the only URLs an anonymous crawler can be served.
 */

/** The paths an anonymous visitor — and a crawler — can actually read. */
const PUBLIC_PATHS = ["", "/privacy", "/terms"] as const;

/** Every locale's rendering of `path`, e.g. `/en/privacy`. */
const inEveryLocale = (path: string) => ["en", "es", "pt"].map((locale) => `/${locale}${path}`);

/** Routes that require a session or are account pages: never listed. */
const UNLISTED_ROUTE_ENDINGS = [
  "/start",
  "/start/avatar",
  "/learning",
  "/achievements",
  "/profile",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
];

describe("sitemap", () => {
  test("WHEN built THEN it lists the home of every locale", () => {
    const entries = sitemap();

    const listed = entries.map((entry) => new URL(entry.url).pathname);
    expect(listed).toEqual(expect.arrayContaining(inEveryLocale("")));
  });

  test("WHEN built THEN it lists both legal documents in every locale", () => {
    const entries = sitemap();

    const listed = entries.map((entry) => new URL(entry.url).pathname);
    expect(listed).toEqual(
      expect.arrayContaining([...inEveryLocale("/privacy"), ...inEveryLocale("/terms")]),
    );
  });

  test("WHEN built THEN it lists nothing beyond the three public paths", () => {
    const entries = sitemap();

    // A count, because the specific mistake this file invites is listing a
    // route that needs a session — which the endings check below cannot catch
    // for a route nobody thought to name.
    const expected = PUBLIC_PATHS.flatMap(inEveryLocale).sort();
    expect(entries.map((entry) => new URL(entry.url).pathname).sort()).toEqual(expected);
  });

  test("WHEN built THEN no course URL is listed", () => {
    const entries = sitemap();

    expect(entries.filter((entry) => entry.url.includes("/courses/"))).toEqual([]);
  });

  test("WHEN built THEN no personal or account route is listed", () => {
    const entries = sitemap();

    const unlisted = entries.filter((entry) =>
      UNLISTED_ROUTE_ENDINGS.some((ending) => entry.url.endsWith(ending)),
    );
    expect(unlisted).toEqual([]);
  });

  test("WHEN the English home is read THEN it declares the home in every locale", () => {
    const entries = sitemap();

    const english = entries.find((entry) => new URL(entry.url).pathname === "/en");
    const alternates = Object.values(english?.alternates?.languages ?? {}).map(
      (url) => new URL(String(url)).pathname,
    );
    expect(alternates.sort()).toEqual(inEveryLocale("").sort());
  });

  test("WHEN the English privacy policy is read THEN it declares it in every locale", () => {
    const entries = sitemap();

    const english = entries.find((entry) => new URL(entry.url).pathname === "/en/privacy");
    const alternates = Object.values(english?.alternates?.languages ?? {}).map(
      (url) => new URL(String(url)).pathname,
    );
    expect(alternates.sort()).toEqual(inEveryLocale("/privacy").sort());
  });
});
