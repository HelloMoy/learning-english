import { describe, expect, test } from "vitest";

import type { BlobStore } from "../src/adapters/persistence/blob-store/blob-store";
import { parseContentLocations } from "../src/adapters/persistence/blob-store/content-locations/content-locations";
import { staleAssetKeys, unresolvedContentKeys } from "./verify-content";

/** A store where only the listed keys resolve. */
function storeResolving(present: string[]): BlobStore {
  return {
    url: (key) => `/content/${key}`,
    exists: async (key) => present.includes(key),
    readText: async () => "",
  };
}

describe("unresolvedContentKeys", () => {
  test("WHEN every key resolves THEN nothing is reported", async () => {
    const keys = ["course/a.mp4", "course/b.pdf"];

    await expect(unresolvedContentKeys(storeResolving(keys), keys)).resolves.toEqual([]);
  });

  test("WHEN a key does not resolve THEN it is named", async () => {
    const keys = ["course/a.mp4", "course/b.pdf"];

    await expect(unresolvedContentKeys(storeResolving(["course/a.mp4"]), keys)).resolves.toEqual([
      "course/b.pdf",
    ]);
  });

  test("WHEN several keys are missing THEN all of them are named, in key order", async () => {
    const keys = ["course/a.mp4", "course/b.pdf", "course/c.md"];

    await expect(unresolvedContentKeys(storeResolving([]), keys)).resolves.toEqual(keys);
  });
});

describe("staleAssetKeys", () => {
  function manifestDeclaring(keys: string[]) {
    return parseContentLocations(
      JSON.stringify({
        version: 1,
        stores: { local: { driver: "local" } },
        default: "local",
        assets: Object.fromEntries(keys.map((key) => [key, { store: "local" }])),
      }),
    );
  }

  test("WHEN every declared asset is in the seed THEN nothing is reported", () => {
    const seedKeys = ["course/a.mp4", "course/b.pdf"];

    expect(staleAssetKeys(manifestDeclaring(seedKeys), seedKeys)).toEqual([]);
  });

  test("WHEN a declared asset is absent from the seed THEN it is named", () => {
    // An exhaustive assets block goes stale the moment content is renamed and
    // the seed is regenerated.
    const manifest = manifestDeclaring(["course/a.mp4", "course/gone.mp4"]);

    expect(staleAssetKeys(manifest, ["course/a.mp4"])).toEqual(["course/gone.mp4"]);
  });

  test("WHEN there is no assets block THEN nothing is reported", () => {
    const manifest = parseContentLocations(
      JSON.stringify({ version: 1, stores: { local: { driver: "local" } }, default: "local" }),
    );

    expect(staleAssetKeys(manifest, ["course/a.mp4"])).toEqual([]);
  });

  test("WHEN several are stale THEN all are named, sorted", () => {
    const manifest = manifestDeclaring(["z/gone.mp4", "a/gone.mp4"]);

    expect(staleAssetKeys(manifest, [])).toEqual(["a/gone.mp4", "z/gone.mp4"]);
  });
});
