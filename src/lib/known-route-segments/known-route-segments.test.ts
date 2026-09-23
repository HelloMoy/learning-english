import { readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

import { isKnownRoutePath, KNOWN_ROUTE_SEGMENTS } from "./known-route-segments";

const LOCALE_SEGMENT_ROOT = join(process.cwd(), "src/app/[locale]");

/**
 * Every first path segment the router can actually serve under `[locale]`,
 * read from disk.
 *
 * @remarks
 * Route groups — `(account)` — are parentheses in the filesystem and absent
 * from the URL, so their children are hoisted. Dynamic and catch-all segments
 * are skipped: `[...notFound]` is the very route this list exists to avoid
 * reaching, and a `[param]` directory would match anything, which is the
 * opposite of a known segment.
 */
function segmentsOnDisk(directory: string = LOCALE_SEGMENT_ROOT): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (!entry.isDirectory()) return [];
    if (entry.name.startsWith("[")) return [];
    if (entry.name.startsWith("(")) return segmentsOnDisk(join(directory, entry.name));
    return [entry.name];
  });
}

describe("KNOWN_ROUTE_SEGMENTS", () => {
  test("WHEN the route tree is scanned THEN the scan finds something", () => {
    // A guard against the scan silently matching nothing, which would make the
    // comparison below pass for the wrong reason.
    expect(segmentsOnDisk().length).toBeGreaterThanOrEqual(5);
  });

  test("WHEN compared with the route tree THEN it names every servable segment", () => {
    // The list lives in the proxy, which runs before the router and therefore
    // cannot read the filesystem. This is what keeps the two in step: a route
    // added on disk and forgotten here would answer 404, and a segment removed
    // from disk but left here would let a missing page answer 200.
    expect([...KNOWN_ROUTE_SEGMENTS].sort()).toEqual(segmentsOnDisk().sort());
  });
});

describe("isKnownRoutePath", () => {
  describe("GIVEN a path the router serves", () => {
    test.each(["/", "/privacy", "/terms", "/learning", "/start/avatar"])(
      "WHEN %s is checked THEN it is known",
      (path) => {
        expect(isKnownRoutePath(path)).toBe(true);
      },
    );

    test("WHEN a deep course path is checked THEN it is known by its first segment", () => {
      // Course, module and lesson identifiers are data, not routes. A wrong
      // slug is the application's business — it renders an inline recovery
      // state — so the proxy must let it through rather than pre-empting it.
      expect(isKnownRoutePath("/courses/whatever/modules/anything/lessons/1")).toBe(true);
    });
  });

  describe("GIVEN a path no route serves", () => {
    test.each(["/error", "/typo", "/xx", "/privacyy", "/start-here"])(
      "WHEN %s is checked THEN it is unknown",
      (path) => {
        expect(isKnownRoutePath(path)).toBe(false);
      },
    );
  });
});
