import { describe, expect, test } from "vitest";

import sitemap from "./sitemap";

/** The per-device routes: they describe one learner, not the catalog. */
const PERSONAL_ROUTE_ENDINGS = ["/start", "/start/avatar", "/learning", "/profile"];

describe("sitemap", () => {
  test("WHEN built THEN it lists the home in every locale", async () => {
    const entries = await sitemap();

    const urls = entries.map((entry) => entry.url);
    for (const locale of ["en", "es", "pt"]) {
      expect(urls.some((url) => url.endsWith(`/${locale}`))).toBe(true);
    }
  });

  test("WHEN built THEN no personal learner route is listed", async () => {
    const entries = await sitemap();

    const personal = entries.filter((entry) =>
      PERSONAL_ROUTE_ENDINGS.some((ending) => entry.url.endsWith(ending)),
    );
    expect(personal).toEqual([]);
  });
});
