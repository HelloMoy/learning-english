import type { BlobStore } from "@/adapters/persistence/blob-store/blob-store";
import {
  parseContentLocations,
  singleLocalStoreManifest,
} from "@/adapters/persistence/blob-store/content-locations/content-locations";
import { LocalFilesystemBlobStore } from "@/adapters/persistence/blob-store/local-filesystem-blob-store/local-filesystem-blob-store";

import { describe, expect, test } from "vitest";

import { RoutingBlobStore } from "./routing-blob-store";

/** A driver that records the paths it was asked for and answers predictably. */
function recordingDriver(name: string): BlobStore & { paths: string[] } {
  const paths: string[] = [];
  return {
    paths,
    url: (objectPath) => {
      paths.push(objectPath);
      return `${name}://${objectPath}`;
    },
    exists: async (objectPath) => {
      paths.push(objectPath);
      return true;
    },
    readText: async (objectPath) => {
      paths.push(objectPath);
      return `${name} body`;
    },
  };
}

const MANIFEST = parseContentLocations(
  JSON.stringify({
    version: 1,
    stores: {
      local: { driver: "local" },
      "s3-video": {
        driver: "s3",
        bucket: "b",
        region: "us-east-1",
        pathPrefix: "v1/",
        visibility: "public",
        publicUrl: "https://cdn.example.com/video",
      },
      "gcs-docs": { driver: "gcs", bucket: "d" },
    },
    default: "local",
    routes: [{ prefix: "course/8-everyday/", store: "s3-video" }],
    overrides: { "course/1-intro/odd.pdf": "gcs-docs" },
  }),
);

function routingStoreWith(drivers: Record<string, BlobStore>): RoutingBlobStore {
  return new RoutingBlobStore({ manifest: MANIFEST, drivers });
}

describe("RoutingBlobStore", () => {
  test("WHEN a key matches no route THEN url() reaches the default store's driver", () => {
    const local = recordingDriver("local");
    const routing = routingStoreWith({
      local: local,
      "s3-video": recordingDriver("s3"),
      "gcs-docs": recordingDriver("gcs"),
    });

    expect(routing.url("course/1-intro/video.mp4")).toBe("local://course/1-intro/video.mp4");
  });

  test("WHEN two keys route differently THEN one call site reaches two drivers", () => {
    const local = recordingDriver("local");
    const s3 = recordingDriver("s3");
    const routing = routingStoreWith({
      local: local,
      "s3-video": s3,
      "gcs-docs": recordingDriver("gcs"),
    });

    const video = routing.url("course/8-everyday/1-lesson/video.mp4");
    const pdf = routing.url("course/1-intro/handout.pdf");

    expect(video).toBe("s3://v1/course/8-everyday/1-lesson/video.mp4");
    expect(pdf).toBe("local://course/1-intro/handout.pdf");
  });

  test("WHEN the store declares a pathPrefix THEN the driver receives the prefixed path", () => {
    const s3 = recordingDriver("s3");
    const routing = routingStoreWith({
      local: recordingDriver("local"),
      "s3-video": s3,
      "gcs-docs": recordingDriver("gcs"),
    });

    routing.url("course/8-everyday/1-lesson/video.mp4");

    expect(s3.paths).toEqual(["v1/course/8-everyday/1-lesson/video.mp4"]);
  });

  test("WHEN exists() is called THEN only the routed driver is consulted", async () => {
    const local = recordingDriver("local");
    const s3 = recordingDriver("s3");
    const routing = routingStoreWith({
      local: local,
      "s3-video": s3,
      "gcs-docs": recordingDriver("gcs"),
    });

    await routing.exists("course/8-everyday/1-lesson/video.mp4");

    expect(s3.paths).toHaveLength(1);
    expect(local.paths).toHaveLength(0);
  });

  test("WHEN readText() is called THEN it is served by the routed driver", async () => {
    const gcs = recordingDriver("gcs");
    const routing = routingStoreWith({
      local: recordingDriver("local"),
      "s3-video": recordingDriver("s3"),
      "gcs-docs": gcs,
    });

    await expect(routing.readText("course/1-intro/odd.pdf")).resolves.toBe("gcs body");
  });

  test("WHEN a declared store has no driver THEN construction throws naming it", () => {
    expect(() => routingStoreWith({ local: recordingDriver("local") })).toThrow(
      /s3-video|gcs-docs/,
    );
  });

  test("WHEN the fallback manifest is used THEN URLs match LocalFilesystemBlobStore exactly", () => {
    const local = new LocalFilesystemBlobStore({
      baseUrl: "/local-filesystem-lesson",
      localRoot: "/abs/root",
    });
    const routing = new RoutingBlobStore({
      manifest: singleLocalStoreManifest(),
      drivers: { local },
    });
    const keys = [
      "advanced-intermediate-course/1-module/1-lesson/video.mp4",
      "advanced-intermediate-course/1-module/1-lesson/poster.jpeg",
      "advanced-intermediate-course/1-module/1-lesson/readme.md",
    ];

    for (const key of keys) {
      expect(routing.url(key)).toBe(local.url(key));
    }
  });

  test("WHEN a key routes to a signed store THEN url() returns the signing endpoint", () => {
    const manifest = parseContentLocations(
      JSON.stringify({
        version: 1,
        stores: { "s3-private": { driver: "s3", bucket: "b", region: "r" } },
        default: "s3-private",
      }),
    );
    const driver = recordingDriver("s3");
    const routing = new RoutingBlobStore({ manifest, drivers: { "s3-private": driver } });

    const url = routing.url("course/1-intro/video.mp4");

    expect(url).toBe("/api/content/course/1-intro/video.mp4");
    expect(driver.paths).toHaveLength(0);
  });

  test("WHEN a key routes to a public remote store THEN url() skips the endpoint", () => {
    const s3 = recordingDriver("s3");
    const routing = routingStoreWith({
      local: recordingDriver("local"),
      "s3-video": s3,
      "gcs-docs": recordingDriver("gcs"),
    });

    expect(routing.url("course/8-everyday/x/video.mp4")).not.toContain("/api/content");
  });

  test("WHEN an unsafe key is resolved THEN it is rejected before any driver call", () => {
    const local = recordingDriver("local");
    const routing = routingStoreWith({
      local: local,
      "s3-video": recordingDriver("s3"),
      "gcs-docs": recordingDriver("gcs"),
    });

    expect(() => routing.url("../../etc/passwd")).toThrow();
    expect(local.paths).toHaveLength(0);
  });
});

describe("RoutingBlobStore — signed endpoint keys", () => {
  test("WHEN the key contains characters needing escaping THEN the endpoint URL encodes them", () => {
    const manifest = parseContentLocations(
      JSON.stringify({
        version: 1,
        stores: { s3: { driver: "s3", bucket: "b", region: "r" } },
        default: "s3",
      }),
    );
    const routing = new RoutingBlobStore({
      manifest,
      drivers: { s3: recordingDriver("s3") },
    });

    // Keys are kebab-case ASCII by contract, but the endpoint must not be the
    // place that assumes it — a `?` would otherwise start a query string.
    expect(routing.url("course/a b?c/video.mp4")).toBe("/api/content/course/a%20b%3Fc/video.mp4");
  });
});

describe("RoutingBlobStore — signing", () => {
  /** A driver that can mint signed URLs, recording the TTL it was given. */
  function signingDriver(): BlobStore & { ttls: number[]; signedPaths: string[] } {
    const ttls: number[] = [];
    const signedPaths: string[] = [];
    return {
      ttls,
      signedPaths,
      url: () => {
        throw new Error("private store has no publicUrl");
      },
      exists: async () => true,
      readText: async () => "",
      signedUrl: async (objectPath: string, ttlSeconds: number) => {
        signedPaths.push(objectPath);
        ttls.push(ttlSeconds);
        return `https://bucket.example.com/${objectPath}?sig=x&ttl=${ttlSeconds}`;
      },
    } as BlobStore & { ttls: number[]; signedPaths: string[] };
  }

  function signedManifest(extra: Record<string, unknown> = {}) {
    return parseContentLocations(
      JSON.stringify({
        version: 1,
        stores: { private: { driver: "s3", bucket: "b", region: "r", ...extra } },
        default: "private",
      }),
    );
  }

  test("WHEN a signed key is asked for a URL THEN the driver signs the prefixed path", async () => {
    const driver = signingDriver();
    const routing = new RoutingBlobStore({
      manifest: signedManifest({ pathPrefix: "v1/" }),
      drivers: { private: driver },
    });

    await routing.signedUrlFor("course/1-intro/video.mp4");

    expect(driver.signedPaths).toEqual(["v1/course/1-intro/video.mp4"]);
  });

  test("WHEN no TTL is declared THEN the six-hour default is used", async () => {
    const driver = signingDriver();
    const routing = new RoutingBlobStore({
      manifest: signedManifest(),
      drivers: { private: driver },
    });

    await routing.signedUrlFor("course/1-intro/video.mp4");

    expect(driver.ttls).toEqual([6 * 60 * 60]);
  });

  test("WHEN the store declares a TTL THEN it overrides the default", async () => {
    const driver = signingDriver();
    const routing = new RoutingBlobStore({
      manifest: signedManifest({ signedUrlTtlSeconds: 120 }),
      drivers: { private: driver },
    });

    await routing.signedUrlFor("course/1-intro/video.mp4");

    expect(driver.ttls).toEqual([120]);
  });

  test("WHEN the key routes to a public store THEN signing is refused", async () => {
    const manifest = parseContentLocations(
      JSON.stringify({
        version: 1,
        stores: { local: { driver: "local" } },
        default: "local",
      }),
    );
    const routing = new RoutingBlobStore({ manifest, drivers: { local: signingDriver() } });

    await expect(routing.signedUrlFor("course/1-intro/video.mp4")).rejects.toThrow(/not signed/i);
  });

  test("WHEN the key is unsafe THEN signing is refused before the driver is called", async () => {
    const driver = signingDriver();
    const routing = new RoutingBlobStore({
      manifest: signedManifest(),
      drivers: { private: driver },
    });

    await expect(routing.signedUrlFor("../../etc/passwd")).rejects.toThrow();
    expect(driver.signedPaths).toHaveLength(0);
  });

  test("WHEN the routed driver cannot sign THEN it fails naming the store", async () => {
    const routing = new RoutingBlobStore({
      manifest: signedManifest(),
      drivers: { private: recordingDriver("s3") },
    });

    await expect(routing.signedUrlFor("course/1-intro/video.mp4")).rejects.toThrow(/private/);
  });

  test("WHEN a key routes to a signed store THEN isSignedKey reports it", () => {
    const routing = new RoutingBlobStore({
      manifest: signedManifest(),
      drivers: { private: signingDriver() },
    });

    expect(routing.isSignedKey("course/1-intro/video.mp4")).toBe(true);
  });
});

describe("RoutingBlobStore — declared asset placement", () => {
  const DECLARED = parseContentLocations(
    JSON.stringify({
      version: 1,
      stores: {
        local: { driver: "local" },
        "s3-video": {
          driver: "s3",
          bucket: "b",
          region: "r",
          pathPrefix: "v1/",
          visibility: "public",
          publicUrl: "https://cdn.example.com/video",
        },
      },
      default: "local",
      assets: {
        "course/1-intro/shared.mp4": { store: "s3-video", objectPath: "shared/one-copy.mp4" },
        "course/1-intro/notes.md": { objectPath: "legacy/notes.md" },
      },
    }),
  );

  function withDrivers() {
    const local = recordingDriver("local");
    const s3 = recordingDriver("s3");
    return {
      local,
      s3,
      routing: new RoutingBlobStore({
        manifest: DECLARED,
        drivers: { local, "s3-video": s3 },
      }),
    };
  }

  test("WHEN url() resolves a declared asset THEN the driver gets the declared path", () => {
    const { s3, routing } = withDrivers();

    expect(routing.url("course/1-intro/shared.mp4")).toBe("s3://shared/one-copy.mp4");
    expect(s3.paths).toEqual(["shared/one-copy.mp4"]);
  });

  test("WHEN exists() resolves a declared asset THEN the declared path is checked", async () => {
    const { s3, routing } = withDrivers();

    await routing.exists("course/1-intro/shared.mp4");

    expect(s3.paths).toEqual(["shared/one-copy.mp4"]);
  });

  test("WHEN readText() resolves a declared asset THEN the declared path is read", async () => {
    const { local, routing } = withDrivers();

    await routing.readText("course/1-intro/notes.md");

    expect(local.paths).toEqual(["legacy/notes.md"]);
  });

  test("WHEN only an objectPath is declared THEN routing still picks the store", async () => {
    const { local, s3, routing } = withDrivers();

    await routing.exists("course/1-intro/notes.md");

    expect(local.paths).toEqual(["legacy/notes.md"]);
    expect(s3.paths).toHaveLength(0);
  });

  test("WHEN a key has no declaration THEN the key-derived path is still used", () => {
    const { local, routing } = withDrivers();

    routing.url("course/1-intro/plain.mp4");

    expect(local.paths).toEqual(["course/1-intro/plain.mp4"]);
  });
});

describe("RoutingBlobStore — signing a declared asset", () => {
  test("WHEN a signed key declares an objectPath THEN that path is what gets signed", async () => {
    const signedPaths: string[] = [];
    const driver = {
      url: () => {
        throw new Error("private");
      },
      exists: async () => true,
      readText: async () => "",
      signedUrl: async (objectPath: string) => {
        signedPaths.push(objectPath);
        return `https://bucket/${objectPath}`;
      },
    } as unknown as BlobStore;

    const routing = new RoutingBlobStore({
      manifest: parseContentLocations(
        JSON.stringify({
          version: 1,
          stores: { private: { driver: "s3", bucket: "b", region: "r", pathPrefix: "v1/" } },
          default: "private",
          assets: { "course/1-intro/video.mp4": { objectPath: "shared/renamed.mp4" } },
        }),
      ),
      drivers: { private: driver },
    });

    await routing.signedUrlFor("course/1-intro/video.mp4");

    expect(signedPaths).toEqual(["shared/renamed.mp4"]);
  });
});
