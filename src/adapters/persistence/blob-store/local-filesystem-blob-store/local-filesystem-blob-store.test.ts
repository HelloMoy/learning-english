import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterAll, describe, expect, test } from "vitest";

import { LocalFilesystemBlobStore } from "./local-filesystem-blob-store";

describe("LocalFilesystemBlobStore", () => {
  // Isolated temp directory so file-existence checks don't leak across
  // suites. Created once per `describe`; cleaned up in `afterAll`.
  const dir = mkdtempSync(path.join(tmpdir(), "lfbs-"));
  const localRoot = dir;
  writeFileSync(path.join(localRoot, "exists.mp4"), "fake-bytes");
  writeFileSync(path.join(localRoot, "exists.md"), "# Welcome");
  writeFileSync(path.join(localRoot, "notes.md"), "## Heading\n\nBody text");

  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  test("WHEN `url` is called with a content key THEN it concatenates baseUrl + key", () => {
    // Arrange
    const store = new LocalFilesystemBlobStore({
      baseUrl: "/local-filesystem-lesson",
      localRoot,
    });

    // Act
    const result = store.url("course/lesson.mp4");

    // Assert
    expect(result).toBe("/local-filesystem-lesson/course/lesson.mp4");
  });

  test("WHEN `url` is called and `baseUrl` has a trailing slash THEN the output has no `//`", () => {
    // Arrange
    const store = new LocalFilesystemBlobStore({
      baseUrl: "/local-filesystem-lesson/",
      localRoot,
    });

    // Act
    const result = store.url("course/lesson.mp4");

    // Assert
    expect(result).toBe("/local-filesystem-lesson/course/lesson.mp4");
    expect(result).not.toContain("//");
  });

  test("WHEN `exists` is called for a file that is on disk THEN it returns `true`", async () => {
    // Arrange
    const store = new LocalFilesystemBlobStore({
      baseUrl: "/local-filesystem-lesson",
      localRoot,
    });

    // Act
    const result = await store.exists("exists.mp4");

    // Assert
    expect(result).toBe(true);
  });

  test("WHEN `exists` is called for a file that is NOT on disk THEN it returns `false`", async () => {
    // Arrange
    const store = new LocalFilesystemBlobStore({
      baseUrl: "/local-filesystem-lesson",
      localRoot,
    });

    // Act
    const result = await store.exists("does-not-exist.mp4");

    // Assert
    expect(result).toBe(false);
  });

  test("WHEN `readText` is called for a known Markdown blob THEN it returns the UTF-8 body", async () => {
    const store = new LocalFilesystemBlobStore({
      baseUrl: "/local-filesystem-lesson",
      localRoot,
    });
    const result = await store.readText("notes.md");
    expect(result).toBe("## Heading\n\nBody text");
  });

  test("WHEN `readText` receives a non-Markdown key THEN it rejects before reading the file", async () => {
    const store = new LocalFilesystemBlobStore({
      baseUrl: "/local-filesystem-lesson",
      localRoot,
    });
    await expect(store.readText("exists.mp4")).rejects.toMatchObject({
      name: "InvalidBlobKeyError",
      reason: "binary",
    });
  });

  test("WHEN `readText` receives a `..` segment THEN it rejects without touching the filesystem", async () => {
    const store = new LocalFilesystemBlobStore({
      baseUrl: "/local-filesystem-lesson",
      localRoot,
    });
    await expect(store.readText("../secrets.md")).rejects.toMatchObject({
      reason: "traversal",
    });
  });

  test("WHEN `readText` receives an absolute key THEN it rejects without touching the filesystem", async () => {
    const store = new LocalFilesystemBlobStore({
      baseUrl: "/local-filesystem-lesson",
      localRoot,
    });
    await expect(store.readText("/etc/hosts.md")).rejects.toMatchObject({
      reason: "absolute",
    });
  });

  test("WHEN `readText` is called for a missing Markdown blob THEN it rejects with not-found", async () => {
    const store = new LocalFilesystemBlobStore({
      baseUrl: "/local-filesystem-lesson",
      localRoot,
    });
    await expect(store.readText("missing.md")).rejects.toMatchObject({
      reason: "not-found",
    });
  });
});
