import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterAll, describe, expect, test } from "vitest";

import {
  loadContentLocations,
  objectPathFor,
  parseContentLocations,
  resolveObjectPathFor,
  resolveStoreNameFor,
  singleLocalStoreManifest,
} from "./content-locations";

/** A manifest document with the given stores, default, routes and overrides. */
function manifestText(doc: Record<string, unknown>): string {
  return JSON.stringify({ version: 1, ...doc });
}

/** The smallest manifest the schema accepts: one local store, no routing. */
function minimalDoc(): Record<string, unknown> {
  return { stores: { local: { driver: "local" } }, default: "local" };
}

describe("parseContentLocations", () => {
  test("WHEN the document is well-formed THEN it returns the declared stores", () => {
    const manifest = parseContentLocations(manifestText(minimalDoc()));

    expect(Object.keys(manifest.stores)).toEqual(["local"]);
    expect(manifest.default).toBe("local");
  });

  test("WHEN the document is not valid JSON THEN it throws saying so", () => {
    expect(() => parseContentLocations("{ not json")).toThrow(/not valid JSON/);
  });

  test("WHEN `default` names a store that is not declared THEN it throws naming it", () => {
    const text = manifestText({ stores: { local: { driver: "local" } }, default: "s3-video" });

    expect(() => parseContentLocations(text)).toThrow(/s3-video/);
  });

  test("WHEN a route names a store that is not declared THEN it throws naming it", () => {
    const text = manifestText({
      ...minimalDoc(),
      routes: [{ prefix: "course/", store: "s3-video" }],
    });

    expect(() => parseContentLocations(text)).toThrow(/s3-video/);
  });

  test("WHEN an override names a store that is not declared THEN it throws naming it", () => {
    const text = manifestText({
      ...minimalDoc(),
      overrides: { "course/module/lesson/video.mp4": "gcs-docs" },
    });

    expect(() => parseContentLocations(text)).toThrow(/gcs-docs/);
  });

  test("WHEN a public store declares no publicUrl THEN it throws naming that store", () => {
    const text = manifestText({
      stores: {
        local: { driver: "local" },
        "s3-video": { driver: "s3", bucket: "b", region: "us-east-1", visibility: "public" },
      },
      default: "local",
    });

    expect(() => parseContentLocations(text)).toThrow(/s3-video/);
  });

  test("WHEN a remote store omits visibility THEN it defaults to signed", () => {
    const text = manifestText({
      stores: {
        local: { driver: "local" },
        "s3-video": { driver: "s3", bucket: "b", region: "us-east-1" },
      },
      default: "local",
    });

    const manifest = parseContentLocations(text);

    const store = manifest.stores["s3-video"];
    expect(store?.driver === "s3" && store.visibility).toBe("signed");
  });

  test("WHEN a local store omits baseUrl THEN it defaults to the public folder prefix", () => {
    const manifest = parseContentLocations(manifestText(minimalDoc()));

    expect(manifest.stores.local).toMatchObject({
      driver: "local",
      baseUrl: "/local-filesystem-lesson",
    });
  });
});

describe("resolveStoreNameFor", () => {
  const manifest = parseContentLocations(
    JSON.stringify({
      version: 1,
      stores: {
        local: { driver: "local" },
        "s3-video": { driver: "s3", bucket: "b", region: "us-east-1" },
        "gcs-docs": { driver: "gcs", bucket: "d" },
      },
      default: "local",
      routes: [
        { prefix: "course/", store: "local" },
        { prefix: "course/8-everyday/", store: "s3-video" },
      ],
      overrides: { "course/8-everyday/odd/one.mp4": "gcs-docs" },
    }),
  );

  test("WHEN the key matches no override and no route THEN it resolves to the default", () => {
    expect(resolveStoreNameFor("other-course/1-intro/video.mp4", manifest)).toBe("local");
  });

  test("WHEN the key matches a route prefix THEN it resolves to that route's store", () => {
    expect(resolveStoreNameFor("course/1-intro/video.mp4", manifest)).toBe("local");
  });

  test("WHEN two route prefixes match THEN the longest one wins", () => {
    expect(resolveStoreNameFor("course/8-everyday/1-lesson/video.mp4", manifest)).toBe("s3-video");
  });

  test("WHEN the key has an exact override THEN it outranks every route", () => {
    expect(resolveStoreNameFor("course/8-everyday/odd/one.mp4", manifest)).toBe("gcs-docs");
  });

  test("WHEN a sibling of an overridden key is resolved THEN it keeps its route", () => {
    expect(resolveStoreNameFor("course/8-everyday/odd/two.mp4", manifest)).toBe("s3-video");
  });

  test("WHEN a prefix matches only a partial path segment THEN it does not apply", () => {
    // "course/" must not match "coursework/…" — a prefix is a path boundary,
    // not a substring.
    expect(resolveStoreNameFor("coursework/1-intro/video.mp4", manifest)).toBe("local");
  });
});

describe("objectPathFor", () => {
  test("WHEN the store declares no pathPrefix THEN the object path is the key", () => {
    const { stores } = parseContentLocations(
      JSON.stringify({
        version: 1,
        stores: { s3: { driver: "s3", bucket: "b", region: "r" } },
        default: "s3",
      }),
    );

    expect(objectPathFor("course/module/lesson/video.mp4", stores.s3!)).toBe(
      "course/module/lesson/video.mp4",
    );
  });

  test("WHEN the store declares a pathPrefix THEN it is prepended to the key", () => {
    const { stores } = parseContentLocations(
      JSON.stringify({
        version: 1,
        stores: { s3: { driver: "s3", bucket: "b", region: "r", pathPrefix: "v1/" } },
        default: "s3",
      }),
    );

    expect(objectPathFor("course/module/lesson/video.mp4", stores.s3!)).toBe(
      "v1/course/module/lesson/video.mp4",
    );
  });

  test("WHEN the pathPrefix has no trailing slash THEN one is inserted", () => {
    const { stores } = parseContentLocations(
      JSON.stringify({
        version: 1,
        stores: { s3: { driver: "s3", bucket: "b", region: "r", pathPrefix: "v1" } },
        default: "s3",
      }),
    );

    expect(objectPathFor("course/video.mp4", stores.s3!)).toBe("v1/course/video.mp4");
  });
});

describe("loadContentLocations", () => {
  const root = mkdtempSync(path.join(tmpdir(), "content-locations-"));

  afterAll(() => rmSync(root, { recursive: true, force: true }));

  /** Writes a manifest file into a fresh directory and returns its path. */
  function manifestAt(body: string): string {
    const dir = mkdtempSync(path.join(root, "dir-"));
    const file = path.join(dir, "content-locations.json");
    writeFileSync(file, body);
    return file;
  }

  test("WHEN no manifest exists at the path THEN it returns null", () => {
    expect(loadContentLocations(path.join(root, "absent", "content-locations.json"))).toBeNull();
  });

  test("WHEN the manifest is valid THEN it returns the parsed document", () => {
    const file = manifestAt(
      JSON.stringify({ version: 1, stores: { local: { driver: "local" } }, default: "local" }),
    );

    expect(loadContentLocations(file)?.default).toBe("local");
  });

  test("WHEN the manifest is invalid THEN it throws rather than falling back", () => {
    const file = manifestAt(
      JSON.stringify({ version: 1, stores: { local: { driver: "local" } }, default: "nope" }),
    );

    expect(() => loadContentLocations(file)).toThrow(/nope/);
  });
});

describe("singleLocalStoreManifest", () => {
  test("WHEN no manifest is configured THEN the fallback is one local store", () => {
    const manifest = singleLocalStoreManifest();

    expect(manifest.default).toBe("local");
    expect(manifest.stores.local).toMatchObject({
      driver: "local",
      baseUrl: "/local-filesystem-lesson",
    });
    expect(manifest.routes).toEqual([]);
    expect(manifest.overrides).toEqual({});
  });

  test("WHEN the fallback resolves any key THEN it routes to the local store", () => {
    expect(resolveStoreNameFor("any/key/at/all.mp4", singleLocalStoreManifest())).toBe("local");
  });
});

describe("assets — per-asset placement", () => {
  function withAssets(assets: Record<string, unknown>): string {
    return JSON.stringify({
      version: 1,
      stores: {
        local: { driver: "local" },
        "s3-video": { driver: "s3", bucket: "b", region: "r" },
      },
      default: "local",
      assets,
    });
  }

  test("WHEN no assets block is declared THEN it resolves to an empty table", () => {
    const manifest = parseContentLocations(manifestText(minimalDoc()));

    expect(manifest.assets).toEqual({});
  });

  test("WHEN an entry declares a store and a path THEN both are kept", () => {
    const manifest = parseContentLocations(
      withAssets({ "course/1/video.mp4": { store: "s3-video", objectPath: "shared/v.mp4" } }),
    );

    expect(manifest.assets["course/1/video.mp4"]).toEqual({
      store: "s3-video",
      objectPath: "shared/v.mp4",
    });
  });

  test("WHEN an entry declares only a store THEN it parses", () => {
    const manifest = parseContentLocations(
      withAssets({ "course/1/video.mp4": { store: "s3-video" } }),
    );

    expect(manifest.assets["course/1/video.mp4"]?.store).toBe("s3-video");
  });

  test("WHEN an entry declares only an objectPath THEN it parses", () => {
    const manifest = parseContentLocations(
      withAssets({ "course/1/video.mp4": { objectPath: "shared/v.mp4" } }),
    );

    expect(manifest.assets["course/1/video.mp4"]?.objectPath).toBe("shared/v.mp4");
  });

  test("WHEN an entry declares neither THEN it is rejected naming the key", () => {
    // An entry that changes nothing is someone who started a declaration and
    // stopped, not a default.
    expect(() => parseContentLocations(withAssets({ "course/1/video.mp4": {} }))).toThrow(
      /course\/1\/video\.mp4/,
    );
  });

  test("WHEN an entry names an undeclared store THEN it is rejected naming it", () => {
    expect(() =>
      parseContentLocations(withAssets({ "course/1/video.mp4": { store: "nowhere" } })),
    ).toThrow(/nowhere/);
  });
});

describe("assets — resolution", () => {
  const manifest = parseContentLocations(
    JSON.stringify({
      version: 1,
      stores: {
        local: { driver: "local" },
        "s3-video": { driver: "s3", bucket: "b", region: "r", pathPrefix: "v1/" },
        "gcs-docs": { driver: "gcs", bucket: "d" },
      },
      default: "local",
      routes: [{ prefix: "course/8-everyday/", store: "s3-video" }],
      overrides: { "course/8-everyday/odd.mp4": "gcs-docs" },
      assets: {
        // Outranks the override on the very same key.
        "course/8-everyday/odd.mp4": { store: "local", objectPath: "legacy/odd.mp4" },
        // Path only: keeps the route's store.
        "course/8-everyday/shared.mp4": { objectPath: "shared/one-copy.mp4" },
        // Store only: keeps the key-derived path.
        "course/1-intro/moved.mp4": { store: "s3-video" },
      },
    }),
  );

  test("WHEN an asset declares a store THEN it outranks the exact override", () => {
    expect(resolveStoreNameFor("course/8-everyday/odd.mp4", manifest)).toBe("local");
  });

  test("WHEN an asset declares a store THEN it outranks the route prefix", () => {
    expect(resolveStoreNameFor("course/1-intro/moved.mp4", manifest)).toBe("s3-video");
  });

  test("WHEN an asset declares no store THEN routing still decides", () => {
    expect(resolveStoreNameFor("course/8-everyday/shared.mp4", manifest)).toBe("s3-video");
  });

  test("WHEN a key has no asset entry THEN the earlier layers are unchanged", () => {
    expect(resolveStoreNameFor("course/8-everyday/other.mp4", manifest)).toBe("s3-video");
    expect(resolveStoreNameFor("elsewhere/thing.mp4", manifest)).toBe("local");
  });
});

describe("resolveObjectPathFor", () => {
  const manifest = parseContentLocations(
    JSON.stringify({
      version: 1,
      stores: {
        local: { driver: "local" },
        "s3-video": { driver: "s3", bucket: "b", region: "r", pathPrefix: "v1/" },
      },
      default: "local",
      routes: [{ prefix: "course/8-everyday/", store: "s3-video" }],
      assets: {
        "course/8-everyday/shared.mp4": { objectPath: "shared/one-copy.mp4" },
        "course/8-everyday/moved.mp4": { store: "s3-video" },
      },
    }),
  );

  test("WHEN an asset declares an objectPath THEN it replaces the key AND the pathPrefix", () => {
    expect(resolveObjectPathFor("course/8-everyday/shared.mp4", manifest)).toBe(
      "shared/one-copy.mp4",
    );
  });

  test("WHEN an asset declares no objectPath THEN the key-derived path is used", () => {
    expect(resolveObjectPathFor("course/8-everyday/moved.mp4", manifest)).toBe(
      "v1/course/8-everyday/moved.mp4",
    );
  });

  test("WHEN a key has no asset entry THEN the store's pathPrefix still applies", () => {
    expect(resolveObjectPathFor("course/8-everyday/plain.mp4", manifest)).toBe(
      "v1/course/8-everyday/plain.mp4",
    );
  });

  test("WHEN the key routes to a prefix-less store THEN the path is the key", () => {
    expect(resolveObjectPathFor("elsewhere/thing.mp4", manifest)).toBe("elsewhere/thing.mp4");
  });
});
