import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterAll, describe, expect, test } from "vitest";

import {
  parseContentLocations,
  resolveObjectPathFor,
  resolveStoreNameFor,
} from "../src/adapters/persistence/blob-store/content-locations/content-locations";
import { materializeContentAssets } from "./materialize-content-assets";

const root = mkdtempSync(path.join(tmpdir(), "materialize-"));

afterAll(() => rmSync(root, { recursive: true, force: true }));

const KEYS = [
  "course/1-intro/1-welcome/video.mp4",
  "course/1-intro/1-welcome/poster.jpeg",
  "course/8-everyday/1-lesson/video.mp4",
];

/** A manifest that routes one module to a prefixed store. */
function manifestAt(extra: Record<string, unknown> = {}): string {
  const file = path.join(mkdtempSync(path.join(root, "dir-")), "content-locations.json");
  writeFileSync(
    file,
    `${JSON.stringify(
      {
        version: 1,
        stores: {
          local: { driver: "local", baseUrl: "/local-filesystem-lesson" },
          "s3-video": { driver: "s3", bucket: "b", region: "r", pathPrefix: "v1/" },
        },
        default: "local",
        routes: [{ prefix: "course/8-everyday/", store: "s3-video" }],
        ...extra,
      },
      null,
      2,
    )}\n`,
  );
  return file;
}

function read(file: string) {
  return parseContentLocations(readFileSync(file, "utf8"));
}

describe("materializeContentAssets", () => {
  test("WHEN a manifest has no assets block THEN every key is written down", () => {
    const file = manifestAt();

    const result = materializeContentAssets({ manifestPath: file, keys: KEYS });

    expect(result.written).toBe(KEYS.length);
    expect(Object.keys(read(file).assets).sort()).toEqual([...KEYS].sort());
  });

  test("WHEN keys are written THEN each records the store and path it already resolved to", () => {
    const file = manifestAt();
    const before = read(file);
    const expected = Object.fromEntries(
      KEYS.map((key) => [
        key,
        { store: resolveStoreNameFor(key, before), objectPath: resolveObjectPathFor(key, before) },
      ]),
    );

    materializeContentAssets({ manifestPath: file, keys: KEYS });

    expect(read(file).assets).toEqual(expected);
  });

  test("WHEN the manifest is materialized THEN no resolved placement changes", () => {
    // The payoff: writing placement down must never move an asset.
    const file = manifestAt();
    const before = read(file);
    const placementBefore = KEYS.map((key) => ({
      store: resolveStoreNameFor(key, before),
      objectPath: resolveObjectPathFor(key, before),
    }));

    materializeContentAssets({ manifestPath: file, keys: KEYS });

    const after = read(file);
    expect(
      KEYS.map((key) => ({
        store: resolveStoreNameFor(key, after),
        objectPath: resolveObjectPathFor(key, after),
      })),
    ).toEqual(placementBefore);
  });

  test("WHEN it runs twice THEN the file is byte-identical the second time", () => {
    const file = manifestAt();
    materializeContentAssets({ manifestPath: file, keys: KEYS });
    const first = readFileSync(file, "utf8");

    materializeContentAssets({ manifestPath: file, keys: KEYS });

    expect(readFileSync(file, "utf8")).toBe(first);
  });

  test("WHEN an entry declares a divergent objectPath THEN materializing keeps it", () => {
    // A hand-declared path records a decision the walk cannot rediscover.
    const file = manifestAt({
      assets: { "course/1-intro/1-welcome/video.mp4": { objectPath: "shared/one-copy.mp4" } },
    });

    materializeContentAssets({ manifestPath: file, keys: KEYS });

    expect(read(file).assets["course/1-intro/1-welcome/video.mp4"]?.objectPath).toBe(
      "shared/one-copy.mp4",
    );
  });

  test("WHEN entries are written THEN they are sorted, so the diff is readable", () => {
    const file = manifestAt();

    materializeContentAssets({ manifestPath: file, keys: [...KEYS].reverse() });

    const written = Object.keys(
      (JSON.parse(readFileSync(file, "utf8")) as { assets: Record<string, unknown> }).assets,
    );
    expect(written).toEqual([...written].sort());
  });

  test("WHEN the manifest is absent THEN it refuses rather than creating one", () => {
    expect(() =>
      materializeContentAssets({ manifestPath: path.join(root, "nope.json"), keys: KEYS }),
    ).toThrow();
  });
});
