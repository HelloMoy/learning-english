import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { buildSeed, runGenerator } from "./generate-course-content-seed";

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

  test("WHEN a course declares external video sources THEN an unresolved key still fails generation", async () => {
    // Guards the exemption from widening into "this course skips validation".
    const lessonDir = path.join(root, "test-course", "1 First Module", "01 Intro");
    mkdirSync(lessonDir, { recursive: true });
    writeFileSync(path.join(lessonDir, "readme.md"), "# Intro body");
    writeFileSync(path.join(lessonDir, "handout.pdf"), "fake-pdf");
    writeFileSync(
      path.join(root, "courses.manifest.json"),
      JSON.stringify({
        version: 1,
        courses: [
          {
            folder: "test-course",
            sequence: 1,
            lessonVideoSources: {
              "1-first-module/01-intro": "https://www.youtube.com/embed/yY7RWGUbqng",
            },
          },
        ],
      }),
    );

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
    expect(written).toContain("seedContentResourceRows");
  });

  test("WHEN the seed is written THEN no emitted key carries a base-URL prefix", async () => {
    // Arrange — the whole point of the change: the public URL prefix is a
    // deployment concern and is not knowable at generation time.
    const lessonDir = path.join(root, "test-course", "1-first-module", "01-intro");
    mkdirSync(lessonDir, { recursive: true });
    writeFileSync(path.join(lessonDir, "readme.md"), "# Intro body");
    writeFileSync(path.join(lessonDir, "handout.pdf"), "fake-pdf");

    // Act
    await runGenerator({ sourceDir: root, outFile });

    // Assert — keys begin with the course slug, never with a base URL. The
    // check targets emitted VALUES, not the file text: the header comment
    // legitimately mentions the content folder by name.
    const written = readFileSync(outFile, "utf8");
    // Prettier unquotes object keys, so the emitted form is `url: "..."`.
    const prefixed = written.match(/\b(?:source|poster|url): "\/[^"]*"/g);
    expect(prefixed).toBeNull();
    expect(written).toContain('url: "test-course/1-first-module/01-intro/handout.pdf"');
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
    const pdf = seed.resourceRows.find((r) => r.url.endsWith("/vowel-chart-v2.pdf"));
    expect(pdf).toBeDefined();
    if (pdf) {
      expect(seed.sourceNames[pdf.id]).toBe("Vowel Chart (v2).pdf");
    }
  });
});

/**
 * The manifest suite uses reading-only lessons for the same reason as the
 * suites above: no `.mp4` means no ffprobe, so these run everywhere.
 */
describe("buildSeed — courses manifest", () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), "seed-manifest-"));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  /** A reading lesson at `<course>/<module>/<lesson>/readme.md`. */
  function writeLesson(
    courseFolder: string,
    moduleFolder: string,
    lessonFolder: string,
    body: string,
  ): void {
    const lessonDir = path.join(root, courseFolder, moduleFolder, lessonFolder);
    mkdirSync(lessonDir, { recursive: true });
    writeFileSync(path.join(lessonDir, "readme.md"), body);
  }

  function writeManifest(courses: Array<Record<string, unknown>>): void {
    writeFileSync(
      path.join(root, "courses.manifest.json"),
      JSON.stringify({ version: 1, courses }),
    );
  }

  test("WHEN there is no manifest THEN one course is emitted with the derived defaults", async () => {
    writeLesson("test-course", "1-first-module", "01-intro", "# Intro body");

    const seed = await buildSeed(root);

    expect(seed.courses).toHaveLength(1);
    expect(seed.courses[0]).toMatchObject({
      slug: "test-course",
      title: "Test Course",
      language: "en",
      sequence: 2,
    });
    expect(seed.courses[0]?.description).toMatch(/^Course content generated from /);
  });

  test("WHEN two courses are declared THEN both are emitted in sequence order with their rows merged", async () => {
    writeLesson("second-course", "1-first-module", "01-intro", "# Second intro");
    writeLesson("first-course", "1-first-module", "01-intro", "# First intro");
    writeManifest([
      { folder: "second-course", sequence: 3 },
      { folder: "first-course", sequence: 1 },
    ]);

    const seed = await buildSeed(root);

    expect(seed.courses.map((course) => course.slug)).toEqual(["first-course", "second-course"]);
    expect(seed.modules).toHaveLength(2);
    expect(seed.lessonRows).toHaveLength(2);
    const courseIds = new Set(seed.courses.map((course) => course.id));
    expect(seed.modules.every((module) => courseIds.has(module.courseId))).toBe(true);
  });

  test("WHEN a folder is not declared THEN it is skipped, named on stderr, and generation succeeds", async () => {
    writeLesson("first-course", "1-first-module", "01-intro", "# First intro");
    writeLesson("staging-course", "1-first-module", "01-intro", "# Staging intro");
    writeManifest([{ folder: "first-course", sequence: 1 }]);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const seed = await buildSeed(root);

    expect(seed.courses).toHaveLength(1);
    expect(warn.mock.calls.flat().join(" ")).toContain("staging-course");
    warn.mockRestore();
  });

  test("WHEN metadata is declared THEN it reaches the emitted Course verbatim", async () => {
    writeLesson("first-course", "1-first-module", "01-intro", "# First intro");
    writeManifest([
      {
        folder: "first-course",
        sequence: 7,
        title: "Curso Avanzado",
        description: "Un curso declarado a mano.",
        language: "es",
      },
    ]);

    const seed = await buildSeed(root);

    expect(seed.courses[0]).toMatchObject({
      title: "Curso Avanzado",
      description: "Un curso declarado a mano.",
      language: "es",
      sequence: 7,
    });
  });

  test("WHEN a course allowlists a module THEN its lesson titles come from the notes heading", async () => {
    writeLesson("first-course", "1-vowels", "4-fast", "# Fast /æ/");
    writeManifest([{ folder: "first-course", sequence: 1, titleFromNotesModules: ["1-vowels"] }]);

    const seed = await buildSeed(root);

    expect(seed.lessonRows[0]?.title).toBe("Fast /æ/");
  });

  test("WHEN another course allowlists a same-slug module THEN this course's titles stay slug-derived", async () => {
    writeLesson("first-course", "1-vowels", "4-fast", "# Fast /æ/");
    writeLesson("second-course", "1-vowels", "4-fast", "# Fast /ɛ/");
    writeManifest([
      { folder: "first-course", sequence: 1, titleFromNotesModules: ["1-vowels"] },
      { folder: "second-course", sequence: 2 },
    ]);

    const seed = await buildSeed(root);

    const titleFor = (slug: string): string | undefined => {
      const course = seed.courses.find((c) => c.slug === slug);
      return seed.lessonRows.find((row) => row.courseId === course?.id)?.title;
    };
    expect(titleFor("first-course")).toBe("Fast /æ/");
    expect(titleFor("second-course")).toBe("Fast");
  });

  test("WHEN a lesson title override is declared THEN it outranks the heading", async () => {
    writeLesson("first-course", "1-vowels", "4-fast", "# Fast /æ/");
    writeManifest([
      {
        folder: "first-course",
        sequence: 1,
        titleFromNotesModules: ["1-vowels"],
        lessonTitleOverrides: { "1-vowels/4-fast": "Fast — the reviewed name" },
      },
    ]);

    const seed = await buildSeed(root);

    expect(seed.lessonRows[0]?.title).toBe("Fast — the reviewed name");
  });

  test("WHEN a module title override is declared THEN it outranks the humanized slug", async () => {
    writeLesson("first-course", "4-ejercicios-de-ritmo", "1-intro", "# Intro");
    writeLesson("first-course", "5-fluidez", "1-intro", "# Intro");
    writeManifest([
      {
        folder: "first-course",
        sequence: 1,
        moduleTitleOverrides: { "4-ejercicios-de-ritmo": "Ejercicios para dominar el ritmo" },
      },
    ]);

    const seed = await buildSeed(root);

    const titleOf = (slug: string): string | undefined =>
      seed.modules.find((module) => module.slug === slug)?.title;
    expect(titleOf("4-ejercicios-de-ritmo")).toBe("Ejercicios para dominar el ritmo");
    expect(titleOf("5-fluidez")).toBe("Fluidez");
  });

  test("WHEN a module title override is declared THEN identity and keys are unchanged", async () => {
    writeLesson("first-course", "4-ejercicios-de-ritmo", "1-intro", "# Intro");
    writeManifest([{ folder: "first-course", sequence: 1 }]);
    const before = await buildSeed(root);

    writeManifest([
      {
        folder: "first-course",
        sequence: 1,
        moduleTitleOverrides: { "4-ejercicios-de-ritmo": "Ejercicios para dominar el ritmo" },
      },
    ]);
    const after = await buildSeed(root);

    expect(after.modules[0]?.id).toBe(before.modules[0]?.id);
    expect(after.modules[0]?.slug).toBe(before.modules[0]?.slug);
    expect(after.modules[0]?.sequence).toBe(before.modules[0]?.sequence);
    expect(after.keys).toEqual(before.keys);
  });

  test("WHEN a module title override names no module THEN generation fails naming the key", async () => {
    // A typo in a module slug would otherwise leave the ugly derived title in
    // place with no signal that the entry did nothing.
    writeLesson("first-course", "4-ejercicios-de-ritmo", "1-intro", "# Intro");
    writeManifest([
      {
        folder: "first-course",
        sequence: 1,
        moduleTitleOverrides: { "4-ejercicios-de-rithmo": "Ejercicios" },
      },
    ]);

    await expect(buildSeed(root)).rejects.toThrow(/4-ejercicios-de-rithmo/);
  });

  test("WHEN the manifest declares a missing folder THEN generation fails without writing", async () => {
    writeLesson("first-course", "1-first-module", "01-intro", "# First intro");
    writeManifest([{ folder: "does-not-exist", sequence: 1 }]);
    const outFile = path.join(root, "seed-content.out.ts");

    await expect(runGenerator({ sourceDir: root, outFile })).rejects.toThrow(/does-not-exist/);
    expect(existsSync(outFile)).toBe(false);
  });

  test("WHEN the manifest is malformed THEN generation fails without falling back", async () => {
    writeLesson("first-course", "1-first-module", "01-intro", "# First intro");
    writeFileSync(path.join(root, "courses.manifest.json"), "{ not json");
    const outFile = path.join(root, "seed-content.out.ts");

    await expect(runGenerator({ sourceDir: root, outFile })).rejects.toThrow(/not valid JSON/);
    expect(existsSync(outFile)).toBe(false);
  });

  test("WHEN the seed is rendered THEN it exports seedContentCourses and no singular course", async () => {
    writeLesson("first-course", "1-first-module", "01-intro", "# First intro");
    writeManifest([{ folder: "first-course", sequence: 1 }]);
    const outFile = path.join(root, "seed-content.out.ts");

    await runGenerator({ sourceDir: root, outFile });

    const written = readFileSync(outFile, "utf8");
    expect(written).toContain("export const seedContentCourses");
    expect(written).not.toContain("export const seedContentCourse ");
    expect(written).not.toContain("SEED_CONTENT_COURSE_ID");
  });
});
