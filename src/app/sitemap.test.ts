import { describe, expect, test } from "vitest";

import sitemap from "./sitemap";

/**
 * Guards `search-discoverability` § "The sitemap lists every servable URL":
 * signing in is required everywhere but the home, so the home is the only URL
 * an anonymous crawler can be served.
 */

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
  test("WHEN built THEN it lists exactly the home of every locale", () => {
    const entries = sitemap();

    expect(entries.map((entry) => new URL(entry.url).pathname).sort()).toEqual([
      "/en",
      "/es",
      "/pt",
    ]);
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
    expect(alternates.sort()).toEqual(["/en", "/es", "/pt"]);
  });
});
