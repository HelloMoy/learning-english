import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, test } from "vitest";

import {
  parseContentLocations,
  resolveStoreNameFor,
} from "../../src/adapters/persistence/blob-store/content-locations/content-locations";
import { allContentKeys } from "./content-keys";

/**
 * The committed manifest is where a reviewer sees content move. These
 * assertions are what keep that record honest: it must parse, and every key
 * the app will ask for must resolve to a store it declares.
 */
describe("content-locations.json (committed)", () => {
  const manifest = parseContentLocations(
    readFileSync(path.join(process.cwd(), "content-locations.json"), "utf8"),
  );

  test("WHEN the committed manifest is parsed THEN it satisfies the schema", () => {
    expect(Object.keys(manifest.stores).length).toBeGreaterThan(0);
  });

  test("WHEN every seed key is routed THEN it lands on a declared store", () => {
    const declared = new Set(Object.keys(manifest.stores));

    for (const key of allContentKeys()) {
      expect(declared.has(resolveStoreNameFor(key, manifest))).toBe(true);
    }
  });

  test("WHEN nothing has been migrated yet THEN every key still routes to local", () => {
    // Today's placement, now written down. This assertion changes the first
    // time a real migration lands, and that diff is the point.
    for (const key of allContentKeys()) {
      expect(resolveStoreNameFor(key, manifest)).toBe("local");
    }
  });

  test("WHEN the manifest is read THEN it carries no credentials", () => {
    const raw = readFileSync(path.join(process.cwd(), "content-locations.json"), "utf8");

    expect(raw).not.toMatch(/secret|password|accessKey|privateKey/i);
  });
});
