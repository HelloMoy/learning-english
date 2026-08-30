import { execFile, execSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import type { BlobStore } from "@/adapters/persistence/blob-store/blob-store";
import {
  resolveLessonRow,
  resolveResourceRow,
  type LessonRow,
} from "@/adapters/persistence/local-filesystem/resolve-content-row/resolve-content-row";
import { Course } from "@/domain/entities/course/course";
import { Module } from "@/domain/entities/module/module";

import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { buildSeed } from "./generate-course-content-seed";

const execFileAsync = promisify(execFile);

/**
 * The generator emits KEYS. These tests resolve them the way the runtime
 * adapters do, so "does this row become a valid entity?" is asserted through
 * the same path production uses.
 */
const testStore: BlobStore = {
  url: (key) => `https://test.example/${key}`,
  exists: () => Promise.resolve(true),
  readText: () => Promise.resolve(""),
};

/**
 * Skip the integration suite when ffmpeg is missing — ffprobe is required
 * to extract durationSeconds from each .mp4.
 */
const FFMPEG_AVAILABLE = (() => {
  try {
    execSync("which ffmpeg", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
})();

describe.skipIf(!FFMPEG_AVAILABLE)("buildSeed (integration)", () => {
  const root = mkdtempSync(path.join(tmpdir(), "seed-gen-test-"));
  // Layout: <root>/test-course/<module>/<lesson>/<files>
  // The generator picks the FIRST top-level folder inside `sourceDir` as
  // the course, so `sourceDir` is `root` and "test-course" is the course.
  const sourceDir = root;
  const courseDir = path.join(sourceDir, "test-course");

  beforeAll(async () => {
    mkdirSync(path.join(courseDir, "1 First Module", "01 Intro"), { recursive: true });
    mkdirSync(path.join(courseDir, "1 First Module", "02 Reading"), { recursive: true });
    mkdirSync(path.join(courseDir, "1 First Module", "03 Bimodal"), { recursive: true });
    mkdirSync(path.join(courseDir, "2 Second Module", "01 Farewell"), { recursive: true });

    // Two tiny silent videos via ffmpeg.
    await execFileAsync(
      "ffmpeg",
      [
        "-y",
        "-f",
        "lavfi",
        "-i",
        "color=c=blue:s=64x64:d=1",
        "-pix_fmt",
        "yuv420p",
        path.join(courseDir, "1 First Module", "01 Intro", "lesson.mp4"),
      ],
      { timeout: 30_000 },
    );
    await execFileAsync(
      "ffmpeg",
      [
        "-y",
        "-f",
        "lavfi",
        "-i",
        "color=c=red:s=64x64:d=1",
        "-pix_fmt",
        "yuv420p",
        path.join(courseDir, "1 First Module", "03 Bimodal", "lesson.mp4"),
      ],
      { timeout: 30_000 },
    );

    writeFileSync(
      path.join(courseDir, "1 First Module", "01 Intro", "thumbnail.jpeg"),
      "fake-jpeg",
    );
    writeFileSync(path.join(courseDir, "1 First Module", "01 Intro", "handout.pdf"), "fake-pdf");
    writeFileSync(
      path.join(courseDir, "1 First Module", "02 Reading", "readme.md"),
      "# Reading body\n\nThis is a reading lesson.",
    );
    writeFileSync(
      path.join(courseDir, "1 First Module", "02 Reading", "exercise.docx"),
      "fake-docx",
    );
    writeFileSync(
      path.join(courseDir, "1 First Module", "03 Bimodal", "readme.md"),
      "# Bimodal notes",
    );
    writeFileSync(path.join(courseDir, "2 Second Module", "01 Farewell", "readme.md"), "# Goodbye");
  }, 90_000);

  afterAll(() => {
    rmSync(root, { recursive: true, force: true });
  });

  test("THEN it parses a Course from the first top-level folder", async () => {
    // Act
    const seed = await buildSeed(sourceDir);

    // Assert — every field round-trips through Zod without throwing.
    expect(() => Course.parse(seed.course)).not.toThrow();
    expect(seed.course.slug).toBe("test-course");
    expect(seed.course.title).toBe("Test Course");
    expect(seed.course.lessonCount).toBe(seed.lessonRows.length);
    expect(seed.course.moduleCount).toBe(seed.modules.length);
  });

  test("AND it discovers both modules in the right order", async () => {
    // Act
    const seed = await buildSeed(sourceDir);

    // Assert
    expect(seed.modules).toHaveLength(2);
    expect(seed.modules.map((m) => m.title)).toEqual(["First Module", "Second Module"]);
    expect(seed.modules.map((m) => m.sequence)).toEqual([1, 2]);
  });

  test("AND it discovers 4 lessons across both modules", async () => {
    // Act
    const seed = await buildSeed(sourceDir);

    // Assert
    expect(seed.lessonRows).toHaveLength(4);
    expect(() => seed.lessonRows.forEach((l) => resolveLessonRow(l, testStore))).not.toThrow();
  });

  test("AND the bimodal lesson (video + readme) becomes a VideoLesson plus a Resource of kind 'other'", async () => {
    // Act
    const seed = await buildSeed(sourceDir);

    // Assert — exactly one video lesson in module 1 lesson 3, and the
    // readme is its notes resource.
    const bimodalLesson = seed.lessonRows.find(
      (l): l is Extract<LessonRow, { kind: "video" }> =>
        l.kind === "video" && l.title.includes("Bimodal"),
    );
    expect(bimodalLesson).toBeDefined();
    if (!bimodalLesson) return;

    const bimodalResources = seed.resourceRows.filter((r) => r.lessonId === bimodalLesson.id);
    const notesResource = bimodalResources.find(
      (r) => r.kind === "other" && r.title.endsWith("Notes"),
    );
    expect(notesResource).toBeDefined();
    if (notesResource) {
      expect(notesResource.url).toContain("03-bimodal/readme.md");
    }
  });

  test("AND the video lesson with a PDF has the PDF as a Resource", async () => {
    // Act
    const seed = await buildSeed(sourceDir);

    // Assert
    const introLesson = seed.lessonRows.find(
      (l): l is Extract<LessonRow, { kind: "video" }> =>
        l.kind === "video" && l.title.includes("Intro"),
    );
    expect(introLesson).toBeDefined();
    if (!introLesson) return;

    const introResources = seed.resourceRows.filter((r) => r.lessonId === introLesson.id);
    const pdf = introResources.find((r) => r.kind === "pdf");
    expect(pdf).toBeDefined();
    if (pdf) {
      expect(pdf.url).toContain("01-intro/handout.pdf");
    }
  });

  test("AND the reading lesson has its markdown body as the lesson body", async () => {
    // Act
    const seed = await buildSeed(sourceDir);

    // Assert — look for the reading lesson in the FIRST module by
    // matching on title (since lessons are sorted by (moduleId, sequence)
    // and we want the deterministic "Reading" lesson, not "Farewell").
    const readingLesson = seed.lessonRows.find(
      (l): l is Extract<LessonRow, { kind: "reading" }> =>
        l.kind === "reading" && l.title === "Reading",
    );
    expect(readingLesson).toBeDefined();
    if (!readingLesson) return;
    expect(readingLesson.body).toContain("Reading body");
  });

  test("AND the reading lesson's docx is a Resource of kind 'other'", async () => {
    // Act
    const seed = await buildSeed(sourceDir);

    // Assert
    const readingLesson = seed.lessonRows.find(
      (l): l is Extract<LessonRow, { kind: "reading" }> =>
        l.kind === "reading" && l.title === "Reading",
    );
    expect(readingLesson).toBeDefined();
    if (!readingLesson) return;

    const readingResources = seed.resourceRows.filter((r) => r.lessonId === readingLesson.id);
    const docx = readingResources.find((r) => r.title.toLowerCase().includes("exercise"));
    expect(docx).toBeDefined();
    expect(docx?.kind).toBe("other");
  });

  test("AND all entities round-trip through their Zod schemas", async () => {
    // Act
    const seed = await buildSeed(sourceDir);

    // Assert
    expect(() => seed.modules.forEach((m) => Module.parse(m))).not.toThrow();
    expect(() => seed.lessonRows.forEach((l) => resolveLessonRow(l, testStore))).not.toThrow();
    expect(() => seed.resourceRows.forEach((r) => resolveResourceRow(r, testStore))).not.toThrow();
  });

  test("AND modules are sorted by sequence ascending", async () => {
    // Act
    const seed = await buildSeed(sourceDir);

    // Assert
    const seqs = seed.modules.map((m) => m.sequence);
    expect(seqs).toEqual([...seqs].sort((a, b) => a - b));
  });

  test("AND lessons are sorted by (moduleId, sequence) ascending", async () => {
    // Act
    const seed = await buildSeed(sourceDir);

    // Assert
    const byModule = new Map<string, number[]>();
    for (const l of seed.lessonRows) {
      const arr = byModule.get(l.moduleId) ?? [];
      arr.push(l.sequence);
      byModule.set(l.moduleId, arr);
    }
    for (const seqs of byModule.values()) {
      expect(seqs).toEqual([...seqs].sort((a, b) => a - b));
    }
  });

  test("AND the generated IDs are stable UUIDs", async () => {
    // Act — run twice and compare the course ID.
    const seedA = await buildSeed(sourceDir);
    const seedB = await buildSeed(sourceDir);

    // Assert
    expect(seedA.course.id).toBe(seedB.course.id);
    expect(seedA.course.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  test("AND each video row's source is a bare content key, not a URL", async () => {
    // Act
    const seed = await buildSeed(sourceDir);

    // Assert — the key starts at the course slug. No base-URL prefix is
    // baked in: the public prefix is a deployment concern, applied by the
    // adapter at read time.
    const videoRow = seed.lessonRows.find((l) => l.kind === "video");
    expect(videoRow).toBeDefined();
    if (videoRow && videoRow.kind === "video") {
      expect(videoRow.source).toMatch(/^test-course\//);
      expect(videoRow.source).toMatch(/\.mp4$/);

      // And it becomes a URL only once a BlobStore resolves it.
      const resolved = resolveLessonRow(videoRow, testStore);
      if (resolved.kind !== "video") throw new Error("unreachable");
      expect(resolved.source).toBe(`https://test.example/${videoRow.source}`);
    }
  });
});
