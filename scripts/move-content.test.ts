import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterAll, describe, expect, test } from "vitest";

import { moveContent } from "./move-content";

/**
 * Orchestration is exercised with two LOCAL stores rooted at different
 * directories: it is the copy/verify/rewrite ordering under test here, not the
 * wire protocol of any one driver — those have their own Docker-gated suites.
 */
const root = mkdtempSync(path.join(tmpdir(), "move-content-"));

afterAll(() => rmSync(root, { recursive: true, force: true }));

const KEYS = ["course/1-intro/video.mp4", "course/1-intro/notes.pdf", "course/2-later/video.mp4"];

/** A workspace with a manifest, a source tree holding every key, and a target root. */
function workspace(): { manifestPath: string; sourceRoot: string; targetRoot: string } {
  const dir = mkdtempSync(path.join(root, "ws-"));
  const sourceRoot = path.join(dir, "source");
  const targetRoot = path.join(dir, "target");
  mkdirSync(targetRoot, { recursive: true });
  for (const key of KEYS) {
    const file = path.join(sourceRoot, key);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, `bytes of ${key}`);
  }

  const manifestPath = path.join(dir, "content-locations.json");
  writeFileSync(
    manifestPath,
    JSON.stringify({
      version: 1,
      stores: {
        local: { driver: "local" },
        archive: { driver: "local", baseUrl: "/archive", pathPrefix: "v1/" },
      },
      default: "local",
    }),
  );
  return { manifestPath, sourceRoot, targetRoot };
}

function readManifest(manifestPath: string): Record<string, unknown> {
  return JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, unknown>;
}

describe("moveContent", () => {
  test("WHEN a prefix is moved THEN its bytes land under the target's pathPrefix", async () => {
    const ws = workspace();

    await moveContent({
      manifestPath: ws.manifestPath,
      localRoots: { local: ws.sourceRoot, archive: ws.targetRoot },
      selector: "course/1-intro/",
      toStore: "archive",
      keys: KEYS,
    });

    expect(existsSync(path.join(ws.targetRoot, "v1/course/1-intro/video.mp4"))).toBe(true);
    expect(existsSync(path.join(ws.targetRoot, "v1/course/1-intro/notes.pdf"))).toBe(true);
    expect(existsSync(path.join(ws.targetRoot, "v1/course/2-later/video.mp4"))).toBe(false);
  });

  test("WHEN a prefix is moved THEN the manifest gains a route for it", async () => {
    const ws = workspace();

    await moveContent({
      manifestPath: ws.manifestPath,
      localRoots: { local: ws.sourceRoot, archive: ws.targetRoot },
      selector: "course/1-intro/",
      toStore: "archive",
      keys: KEYS,
    });

    expect(readManifest(ws.manifestPath).routes).toEqual([
      { prefix: "course/1-intro/", store: "archive" },
    ]);
  });

  test("WHEN a single key is moved THEN the manifest gains an override, not a route", async () => {
    const ws = workspace();

    await moveContent({
      manifestPath: ws.manifestPath,
      localRoots: { local: ws.sourceRoot, archive: ws.targetRoot },
      selector: "course/1-intro/video.mp4",
      toStore: "archive",
      keys: KEYS,
    });

    const manifest = readManifest(ws.manifestPath);
    expect(manifest.overrides).toEqual({ "course/1-intro/video.mp4": "archive" });
    expect(manifest.routes).toEqual([]);
  });

  test("WHEN the copy is verified THEN the source objects are still there", async () => {
    // Deleting is a separate opt-in step; a move must never be the last copy.
    const ws = workspace();

    await moveContent({
      manifestPath: ws.manifestPath,
      localRoots: { local: ws.sourceRoot, archive: ws.targetRoot },
      selector: "course/1-intro/",
      toStore: "archive",
      keys: KEYS,
    });

    expect(existsSync(path.join(ws.sourceRoot, "course/1-intro/video.mp4"))).toBe(true);
  });

  test("WHEN deleteSource is asked for THEN the source objects are removed after verification", async () => {
    const ws = workspace();

    await moveContent({
      manifestPath: ws.manifestPath,
      localRoots: { local: ws.sourceRoot, archive: ws.targetRoot },
      selector: "course/1-intro/",
      toStore: "archive",
      keys: KEYS,
      deleteSource: true,
    });

    expect(existsSync(path.join(ws.sourceRoot, "course/1-intro/video.mp4"))).toBe(false);
    expect(existsSync(path.join(ws.sourceRoot, "course/2-later/video.mp4"))).toBe(true);
  });

  test("WHEN a source object is missing THEN the manifest is left untouched", async () => {
    const ws = workspace();
    rmSync(path.join(ws.sourceRoot, "course/1-intro/video.mp4"));
    const before = readFileSync(ws.manifestPath, "utf8");

    await expect(
      moveContent({
        manifestPath: ws.manifestPath,
        localRoots: { local: ws.sourceRoot, archive: ws.targetRoot },
        selector: "course/1-intro/",
        toStore: "archive",
        keys: KEYS,
      }),
    ).rejects.toThrow();

    expect(readFileSync(ws.manifestPath, "utf8")).toBe(before);
  });

  test("WHEN a source object is missing THEN nothing at the source is deleted", async () => {
    const ws = workspace();
    rmSync(path.join(ws.sourceRoot, "course/1-intro/video.mp4"));

    await expect(
      moveContent({
        manifestPath: ws.manifestPath,
        localRoots: { local: ws.sourceRoot, archive: ws.targetRoot },
        selector: "course/1-intro/",
        toStore: "archive",
        keys: KEYS,
        deleteSource: true,
      }),
    ).rejects.toThrow();

    expect(existsSync(path.join(ws.sourceRoot, "course/1-intro/notes.pdf"))).toBe(true);
  });

  test("WHEN the target store is not declared THEN it refuses before copying anything", async () => {
    const ws = workspace();

    await expect(
      moveContent({
        manifestPath: ws.manifestPath,
        localRoots: { local: ws.sourceRoot, archive: ws.targetRoot },
        selector: "course/1-intro/",
        toStore: "nowhere",
        keys: KEYS,
      }),
    ).rejects.toThrow(/nowhere/);

    expect(existsSync(path.join(ws.targetRoot, "v1/course/1-intro/video.mp4"))).toBe(false);
  });

  test("WHEN the selector matches no key THEN it refuses rather than writing an empty route", async () => {
    const ws = workspace();

    await expect(
      moveContent({
        manifestPath: ws.manifestPath,
        localRoots: { local: ws.sourceRoot, archive: ws.targetRoot },
        selector: "course/9-absent/",
        toStore: "archive",
        keys: KEYS,
      }),
    ).rejects.toThrow(/no content keys/i);
  });

  test("WHEN keys already live in the target THEN they are skipped, not re-copied", async () => {
    const ws = workspace();
    await moveContent({
      manifestPath: ws.manifestPath,
      localRoots: { local: ws.sourceRoot, archive: ws.targetRoot },
      selector: "course/1-intro/",
      toStore: "archive",
      keys: KEYS,
    });

    const result = await moveContent({
      manifestPath: ws.manifestPath,
      localRoots: { local: ws.sourceRoot, archive: ws.targetRoot },
      selector: "course/1-intro/",
      toStore: "archive",
      keys: KEYS,
    });

    expect(result.copied).toEqual([]);
    expect(result.alreadyThere).toHaveLength(2);
  });
});
