import { execFile, execSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { Course } from "@/domain/entities/course/course";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";
import { Resource } from "@/domain/entities/resource/resource";

import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { buildSeed } from "./generate-course-content-seed";

const execFileAsync = promisify(execFile);

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
    expect(seed.course.lessonCount).toBe(seed.lessons.length);
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
    expect(seed.lessons).toHaveLength(4);
    expect(() => seed.lessons.forEach((l) => Lesson.parse(l))).not.toThrow();
  });

  test("AND the bimodal lesson (video + readme) becomes a VideoLesson plus a Resource of kind 'other'", async () => {
    // Act
    const seed = await buildSeed(sourceDir);

    // Assert — exactly one video lesson in module 1 lesson 3, and the
    // readme is its notes resource.
    const bimodalLesson = seed.lessons.find(
      (l): l is Extract<Lesson, { kind: "video" }> =>
        l.kind === "video" && l.title.includes("Bimodal"),
    );
    expect(bimodalLesson).toBeDefined();
    if (!bimodalLesson) return;

    const bimodalResources = seed.resources.filter((r) => r.lessonId === bimodalLesson.id);
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
    const introLesson = seed.lessons.find(
      (l): l is Extract<Lesson, { kind: "video" }> =>
        l.kind === "video" && l.title.includes("Intro"),
    );
    expect(introLesson).toBeDefined();
    if (!introLesson) return;

    const introResources = seed.resources.filter((r) => r.lessonId === introLesson.id);
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
    const readingLesson = seed.lessons.find(
      (l): l is Extract<Lesson, { kind: "reading" }> =>
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
    const readingLesson = seed.lessons.find(
      (l): l is Extract<Lesson, { kind: "reading" }> =>
        l.kind === "reading" && l.title === "Reading",
    );
    expect(readingLesson).toBeDefined();
    if (!readingLesson) return;

    const readingResources = seed.resources.filter((r) => r.lessonId === readingLesson.id);
    const docx = readingResources.find((r) => r.title.toLowerCase().includes("exercise"));
    expect(docx).toBeDefined();
    expect(docx?.kind).toBe("other");
  });

  test("AND all entities round-trip through their Zod schemas", async () => {
    // Act
    const seed = await buildSeed(sourceDir);

    // Assert
    expect(() => seed.modules.forEach((m) => Module.parse(m))).not.toThrow();
    expect(() => seed.lessons.forEach((l) => Lesson.parse(l))).not.toThrow();
    expect(() => seed.resources.forEach((r) => Resource.parse(r))).not.toThrow();
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
    for (const l of seed.lessons) {
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

  test("AND the URL on each VideoLesson is the blobStore.url() of its key", async () => {
    // Act
    const seed = await buildSeed(sourceDir);

    // Assert
    const videoLesson = seed.lessons.find((l) => l.kind === "video");
    expect(videoLesson).toBeDefined();
    if (videoLesson && videoLesson.kind === "video") {
      expect(videoLesson.source).toMatch(/^\/local-filesystem-lesson\/test-course\//);
      expect(videoLesson.source).toMatch(/\.mp4$/);
    }
  });
});
