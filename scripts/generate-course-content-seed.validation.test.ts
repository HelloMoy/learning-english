import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { runGenerator } from "./generate-course-content-seed";

/**
 * These suites use reading-only lessons (readme + a resource file) so they
 * never invoke ffprobe — they run regardless of whether ffmpeg is installed.
 * They exercise runGenerator's exists() validation and seedContentSourceNames
 * emission (the manifest bridge), which buildSeed's integration test does not.
 */
describe("runGenerator — exists() validation", () => {
  let root: string;
  let outFile: string;

  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), "seed-validate-"));
    outFile = path.join(root, "seed-content.out.ts");
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  test("WHEN a folder is NOT normalized THEN the emitted slug key misses on disk and generation fails without writing", async () => {
    // Arrange — raw folder names; the generator emits slug keys that do not
    // resolve against the raw on-disk paths.
    const lessonDir = path.join(root, "test-course", "1 First Module", "01 Intro");
    mkdirSync(lessonDir, { recursive: true });
    writeFileSync(path.join(lessonDir, "readme.md"), "# Intro body");
    writeFileSync(path.join(lessonDir, "handout.pdf"), "fake-pdf");

    // Act + Assert
    await expect(runGenerator({ sourceDir: root, outFile })).rejects.toThrow(
      /do not resolve on disk/,
    );
    expect(existsSync(outFile)).toBe(false);
  });

  test("WHEN all folders ARE normalized THEN every key resolves and the seed is written", async () => {
    // Arrange — slug folder + slug file names.
    const lessonDir = path.join(root, "test-course", "1-first-module", "01-intro");
    mkdirSync(lessonDir, { recursive: true });
    writeFileSync(path.join(lessonDir, "readme.md"), "# Intro body");
    writeFileSync(path.join(lessonDir, "handout.pdf"), "fake-pdf");

    // Act
    await runGenerator({ sourceDir: root, outFile });

    // Assert
    expect(existsSync(outFile)).toBe(true);
    const written = readFileSync(outFile, "utf8");
    expect(written).toContain("seedContentResources");
  });
});

describe("runGenerator — seedContentSourceNames (manifest bridge)", () => {
  let root: string;
  let outFile: string;

  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), "seed-names-"));
    outFile = path.join(root, "seed-content.out.ts");
    const lessonDir = path.join(root, "test-course", "1-first-module", "01-intro");
    mkdirSync(lessonDir, { recursive: true });
    writeFileSync(path.join(lessonDir, "readme.md"), "# Intro body");
    writeFileSync(path.join(lessonDir, "handout.pdf"), "fake-pdf");
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  test("WHEN a manifest is present THEN original names are recovered into seedContentSourceNames", async () => {
    // Arrange — a manifest mapping slug paths back to their original raw names.
    writeFileSync(
      path.join(root, "rename-manifest.json"),
      JSON.stringify({
        version: 1,
        entries: [
          { from: "test-course/1 First Module", to: "test-course/1-first-module" },
          {
            from: "test-course/1 First Module/01 Intro",
            to: "test-course/1-first-module/01-intro",
          },
          {
            from: "test-course/1 First Module/01 Intro/Vowel Chart (v2).pdf",
            to: "test-course/1-first-module/01-intro/handout.pdf",
          },
        ],
      }),
    );

    // Act
    await runGenerator({ sourceDir: root, outFile });

    // Assert
    const written = readFileSync(outFile, "utf8");
    expect(written).toContain("seedContentSourceNames");
    expect(written).toContain("1 First Module");
    expect(written).toContain("Vowel Chart (v2).pdf");
  });

  test("WHEN no manifest is present THEN it falls back to on-disk names without failing", async () => {
    // Act — no manifest written.
    await runGenerator({ sourceDir: root, outFile });

    // Assert — the export exists and falls back to the current slug name.
    const written = readFileSync(outFile, "utf8");
    expect(written).toContain("seedContentSourceNames");
    expect(written).toContain("1-first-module");
  });

  test("WHEN a resource has a raw original name with spaces THEN seedContentSourceNames preserves it (no manifest needed)", async () => {
    // Arrange — a slug-folder + a resource whose raw name has spaces. To
    // mirror the post-normalization state on disk (the manifest bridge only
    // kicks in for re-runs where the rename already happened), we create
    // the slug-named file on disk and pass the RAW original name in a
    // rename-manifest so sourceNames falls through to the manifest path.
    // The contract under test: sourceNames preserves the RAW original
    // regardless of which channel wins (manifest OR raw-on-disk fallback).
    const lessonDir = path.join(root, "test-course", "1-first-module", "01-intro");
    mkdirSync(lessonDir, { recursive: true });
    writeFileSync(path.join(lessonDir, "readme.md"), "# Intro body");
    writeFileSync(path.join(lessonDir, "vowel-chart-v2.pdf"), "fake-pdf");
    writeFileSync(
      path.join(root, "rename-manifest.json"),
      JSON.stringify({
        version: 1,
        entries: [
          {
            from: "test-course/1-first-module/01-intro/Vowel Chart (v2).pdf",
            to: "test-course/1-first-module/01-intro/vowel-chart-v2.pdf",
          },
        ],
      }),
    );

    // Act
    await runGenerator({ sourceDir: root, outFile });

    // Assert — the resource id maps to the RAW original name.
    const written = readFileSync(outFile, "utf8");
    expect(written).toContain("seedContentSourceNames");
    expect(written).toContain("Vowel Chart (v2).pdf");
  });

  test("WHEN a resource has a raw original name with spaces AND no manifest THEN sourceNames falls back to the raw name captured during walk", async () => {
    // Arrange — RAW filename on disk (no normalization applied yet), NO
    // manifest. The fallback now uses the raw filename captured at walk
    // time via `resourceRawNames`, so even without a manifest the original
    // name survives. We use `buildSeed` directly (not `runGenerator`) so
    // the `exists()` validation guard does not fire.
    const lessonDir = path.join(root, "test-course", "1-first-module", "01-intro");
    mkdirSync(lessonDir, { recursive: true });
    writeFileSync(path.join(lessonDir, "readme.md"), "# Intro body");
    // Raw filename on disk.
    writeFileSync(path.join(lessonDir, "Vowel Chart (v2).pdf"), "fake-pdf");

    // Act — no manifest, direct buildSeed.
    const { buildSeed } = await import("./generate-course-content-seed");
    const seed = await buildSeed(root);

    // Assert — the resource id maps to the RAW original name.
    const pdf = seed.resources.find((r) => r.url.endsWith("/vowel-chart-v2.pdf"));
    expect(pdf).toBeDefined();
    if (pdf) {
      expect(seed.sourceNames[pdf.id]).toBe("Vowel Chart (v2).pdf");
    }
  });
});
