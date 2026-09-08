import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { LocalFilesystemBlobStore } from "@/adapters/persistence/blob-store/local-filesystem-blob-store/local-filesystem-blob-store";

import { afterAll, describe, expect, test } from "vitest";

import { createContentBlobStore } from "./create-content-blob-store";

const root = mkdtempSync(path.join(tmpdir(), "create-blob-store-"));

afterAll(() => rmSync(root, { recursive: true, force: true }));

/** Writes a manifest and returns its path. */
function manifestAt(doc: Record<string, unknown>): string {
  const file = path.join(mkdtempSync(path.join(root, "dir-")), "content-locations.json");
  writeFileSync(file, JSON.stringify({ version: 1, ...doc }));
  return file;
}

const LOCAL_ROOT = "/abs/content";
const KEY = "advanced-intermediate-course/1-module/1-lesson/video.mp4";

describe("createContentBlobStore", () => {
  test("WHEN no manifest exists THEN URLs match the plain local driver exactly", () => {
    const store = createContentBlobStore({
      manifestPath: path.join(root, "absent", "content-locations.json"),
      localRoot: LOCAL_ROOT,
    });
    const local = new LocalFilesystemBlobStore({
      baseUrl: "/local-filesystem-lesson",
      localRoot: LOCAL_ROOT,
    });

    expect(store.url(KEY)).toBe(local.url(KEY));
  });

  test("WHEN the manifest declares one local store THEN its baseUrl is used", () => {
    const store = createContentBlobStore({
      manifestPath: manifestAt({
        stores: { local: { driver: "local", baseUrl: "https://cdn.example.com/content" } },
        default: "local",
      }),
      localRoot: LOCAL_ROOT,
    });

    expect(store.url(KEY)).toBe(`https://cdn.example.com/content/${KEY}`);
  });

  test("WHEN the manifest is invalid THEN construction throws rather than falling back", () => {
    const manifestPath = manifestAt({
      stores: { local: { driver: "local" } },
      default: "missing-store",
    });

    expect(() => createContentBlobStore({ manifestPath, localRoot: LOCAL_ROOT })).toThrow(
      /missing-store/,
    );
  });
});

describe("createContentBlobStore — remote drivers", () => {
  test("WHEN a public S3 store owns a key THEN its URL comes from that store's publicUrl", () => {
    const store = createContentBlobStore({
      manifestPath: manifestAt({
        stores: {
          local: { driver: "local" },
          "s3-video": {
            driver: "s3",
            bucket: "lessons-video",
            region: "us-east-1",
            pathPrefix: "v1/",
            visibility: "public",
            publicUrl: "https://cdn.example.com/video",
          },
        },
        default: "local",
        routes: [{ prefix: "advanced-intermediate-course/1-module/", store: "s3-video" }],
      }),
      localRoot: LOCAL_ROOT,
    });

    expect(store.url(KEY)).toBe(`https://cdn.example.com/video/v1/${KEY}`);
  });

  test("WHEN a private S3 store owns a key THEN its URL is the signing endpoint", () => {
    const store = createContentBlobStore({
      manifestPath: manifestAt({
        stores: { "s3-private": { driver: "s3", bucket: "b", region: "us-east-1" } },
        default: "s3-private",
      }),
      localRoot: LOCAL_ROOT,
    });

    expect(store.url(KEY)).toBe(`/api/content/${KEY}`);
  });

  test("WHEN a store names an unsupported driver THEN construction throws naming it", () => {
    const manifestPath = manifestAt({
      stores: { local: { driver: "local" }, weird: { driver: "ftp", host: "h" } },
      default: "local",
    });

    expect(() => createContentBlobStore({ manifestPath, localRoot: LOCAL_ROOT })).toThrow();
  });
});

describe("createContentBlobStore — GCS driver", () => {
  test("WHEN a public GCS store owns a key THEN its URL comes from that store's publicUrl", () => {
    const store = createContentBlobStore({
      manifestPath: manifestAt({
        stores: {
          "gcs-docs": {
            driver: "gcs",
            bucket: "lessons-docs",
            visibility: "public",
            publicUrl: "https://cdn.example.com/docs",
          },
        },
        default: "gcs-docs",
      }),
      localRoot: LOCAL_ROOT,
    });

    expect(store.url(KEY)).toBe(`https://cdn.example.com/docs/${KEY}`);
  });
});
