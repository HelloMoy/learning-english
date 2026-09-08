import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { reshapeCourseTree, toNotesMarkdown, type CoursePlan } from "./reshape-course-tree";

describe("toNotesMarkdown", () => {
  const MODULE = "Consonants";

  test("WHEN the first line is a title THEN it becomes the document heading", () => {
    const source = ["/ʒ/", MODULE, "El sonido es sonoro.", "", "The sound is voiced."].join("\n");

    expect(toNotesMarkdown(source, MODULE)).toBe(
      ["# /ʒ/", "", "El sonido es sonoro.", "", "The sound is voiced."].join("\n"),
    );
  });

  test("WHEN the module name follows the title THEN that line is dropped", () => {
    const source = ["/s/", MODULE, "Cuerpo."].join("\n");

    expect(toNotesMarkdown(source, MODULE)).not.toContain(MODULE);
  });

  test("WHEN the module name does not follow the title THEN the body is kept whole", () => {
    const source = ["/s/", "Cuerpo en la segunda línea."].join("\n");

    expect(toNotesMarkdown(source, MODULE)).toBe(
      ["# /s/", "", "Cuerpo en la segunda línea."].join("\n"),
    );
  });

  test("WHEN the document opens with blank lines THEN the title is still found", () => {
    const source = ["", "Diphthong Sound /aʊ/", MODULE, "Cuerpo."].join("\n");

    expect(toNotesMarkdown(source, MODULE)).toBe(
      ["# Diphthong Sound /aʊ/", "", "Cuerpo."].join("\n"),
    );
  });

  test("WHEN the first line is the module name THEN no heading is emitted", () => {
    // The lesson simply has no title line; its title comes from an override.
    const source = [MODULE, "🗣️ Dominar la T y D interdentales.", "", "Mastering them."].join("\n");

    expect(toNotesMarkdown(source, MODULE)).toBe(
      ["🗣️ Dominar la T y D interdentales.", "", "Mastering them."].join("\n"),
    );
  });

  test("WHEN the first line is longer than a title THEN it is body, not a heading", () => {
    // One lesson opens straight into a 250-character Spanish paragraph; read
    // as a title it would become a paragraph-length row in the outline.
    const body = `En esta introducción a las consonantes ${"x".repeat(120)}.`;
    const source = [body, "", "In this introduction."].join("\n");

    const notes = toNotesMarkdown(source, MODULE);

    expect(notes.startsWith("#")).toBe(false);
    expect(notes).toBe(source);
  });

  test("WHEN the document already opens with a heading THEN it is returned unchanged", () => {
    const source = ["# /ʒ/", "", "Cuerpo."].join("\n");

    expect(toNotesMarkdown(source, MODULE)).toBe(source);
  });

  test("WHEN the document is only a title THEN the heading stands alone", () => {
    const source = ["La Forma Más Rápida de Mejorar tu Speaking!", "Introduction", ""].join("\n");

    expect(toNotesMarkdown(source, "Introduction")).toBe(
      "# La Forma Más Rápida de Mejorar tu Speaking!",
    );
  });

  test("WHEN the document carries CRLF line endings THEN they are normalized", () => {
    const source = "/s/\r\nConsonants\r\nCuerpo.\r\n";

    expect(toNotesMarkdown(source, MODULE)).toBe(["# /s/", "", "Cuerpo."].join("\n"));
  });
});

describe("reshapeCourseTree", () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(path.join(tmpdir(), "reshape-"));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  const mkfile = (rel: string, body = "x"): void => {
    const abs = path.join(root, rel);
    mkdirSync(path.dirname(abs), { recursive: true });
    writeFileSync(abs, body);
  };

  const exists = (rel: string): boolean => existsSync(path.join(root, rel));

  const entries = (rel: string): string[] =>
    readdirSync(path.join(root, rel))
      .filter((name) => name !== ".DS_Store")
      .sort();

  /** The plan the imported course needs, in miniature. */
  function planFor(overrides: Partial<CoursePlan> = {}): CoursePlan {
    return {
      folder: "basic-course",
      promotions: [],
      renames: [],
      lessonWraps: [],
      resourcesFolder: "resources",
      notesFile: "description.md",
      strayFiles: [".DS_Store", "index.html"],
      ...overrides,
    };
  }

  /** A course shaped exactly like the imported one, in miniature. */
  function writeImportedCourse(): void {
    mkfile("basic-course/1 Introduction/Introduction.mp4");
    mkfile("basic-course/1 Introduction/description.md", "El intro\nIntroduction\nCuerpo.");
    mkfile("basic-course/2 Sounds/index.html", "<p>placeholder</p>");
    mkfile("basic-course/2 Sounds/1 Vowels/1 Schwa/schwa.mp4");
    mkfile("basic-course/2 Sounds/1 Vowels/1 Schwa/description.md", "/ə/\nVowels\nCuerpo.");
    mkfile("basic-course/2 Sounds/1 Vowels/1 Schwa/resources/practice.pdf");
    mkfile("basic-course/2 Sounds/2 Consonants/1 S/s.mp4");
    mkfile("basic-course/3 Ritmo/1 Afina/afina.mp4");
  }

  const IMPORTED_PLAN = (): CoursePlan =>
    planFor({
      promotions: [
        { parent: "2 Sounds", child: "1 Vowels", to: "2 Vowels" },
        { parent: "2 Sounds", child: "2 Consonants", to: "3 Consonants" },
      ],
      renames: [{ from: "3 Ritmo", to: "4 Ritmo" }],
      lessonWraps: [{ moduleFolder: "1 Introduction", lesson: "1 Introduction" }],
    });

  test("WHEN not applied THEN the plan is returned and nothing on disk changes", () => {
    writeImportedCourse();

    const result = reshapeCourseTree({ rootDir: root, plans: [IMPORTED_PLAN()] });

    expect(result.applied).toBe(false);
    expect(result.moves.length).toBeGreaterThan(0);
    expect(exists("basic-course/2 Sounds/1 Vowels/1 Schwa/schwa.mp4")).toBe(true);
    expect(exists("basic-course/2 Vowels")).toBe(false);
    expect(exists("basic-course/1 Introduction/description.md")).toBe(true);
  });

  test("WHEN not applied THEN the plan matches what applying would do", () => {
    // The dry run is the review artifact. If it enumerated only the lessons
    // visible before the promotions land, it would hide most of the migration.
    writeImportedCourse();
    const planned = reshapeCourseTree({ rootDir: root, plans: [IMPORTED_PLAN()] });

    const performed = reshapeCourseTree({ rootDir: root, plans: [IMPORTED_PLAN()], apply: true });

    expect(planned.moves).toEqual(performed.moves);
    expect(planned.rewritten).toEqual(performed.rewritten);
    expect(planned.removed).toEqual(performed.removed);
  });

  test("WHEN applied THEN nested modules are promoted and the emptied parent is removed", () => {
    writeImportedCourse();

    reshapeCourseTree({ rootDir: root, plans: [IMPORTED_PLAN()], apply: true });

    expect(exists("basic-course/2 Vowels/1 Schwa/schwa.mp4")).toBe(true);
    expect(exists("basic-course/3 Consonants/1 S/s.mp4")).toBe(true);
    expect(exists("basic-course/2 Sounds")).toBe(false);
  });

  test("WHEN applied THEN displaced modules are renumbered", () => {
    writeImportedCourse();

    reshapeCourseTree({ rootDir: root, plans: [IMPORTED_PLAN()], apply: true });

    expect(entries("basic-course")).toEqual([
      "1 Introduction",
      "2 Vowels",
      "3 Consonants",
      "4 Ritmo",
    ]);
  });

  test("WHEN a module holds loose files THEN they are wrapped in a lesson folder", () => {
    writeImportedCourse();

    reshapeCourseTree({ rootDir: root, plans: [IMPORTED_PLAN()], apply: true });

    expect(entries("basic-course/1 Introduction")).toEqual(["1 Introduction"]);
    expect(exists("basic-course/1 Introduction/1 Introduction/Introduction.mp4")).toBe(true);
  });

  test("WHEN a lesson keeps resources in a subfolder THEN they are hoisted beside the media", () => {
    writeImportedCourse();

    reshapeCourseTree({ rootDir: root, plans: [IMPORTED_PLAN()], apply: true });

    expect(exists("basic-course/2 Vowels/1 Schwa/practice.pdf")).toBe(true);
    expect(exists("basic-course/2 Vowels/1 Schwa/resources")).toBe(false);
  });

  test("WHEN a lesson carries exported notes THEN they become readme.md with a heading", () => {
    writeImportedCourse();

    reshapeCourseTree({ rootDir: root, plans: [IMPORTED_PLAN()], apply: true });

    const notes = readFileSync(path.join(root, "basic-course/2 Vowels/1 Schwa/readme.md"), "utf8");
    expect(notes).toBe("# /ə/\n\nCuerpo.\n");
    expect(exists("basic-course/2 Vowels/1 Schwa/description.md")).toBe(false);
  });

  test("WHEN the export left stray files THEN they are removed", () => {
    writeImportedCourse();
    mkfile("basic-course/.DS_Store");

    reshapeCourseTree({ rootDir: root, plans: [IMPORTED_PLAN()], apply: true });

    expect(existsSync(path.join(root, "basic-course/.DS_Store"))).toBe(false);
    expect(exists("basic-course/2 Vowels/index.html")).toBe(false);
  });

  test("WHEN run a second time THEN nothing moves and the tree is unchanged", () => {
    writeImportedCourse();
    reshapeCourseTree({ rootDir: root, plans: [IMPORTED_PLAN()], apply: true });
    const before = entries("basic-course");

    const second = reshapeCourseTree({ rootDir: root, plans: [IMPORTED_PLAN()], apply: true });

    expect(second.moves).toEqual([]);
    expect(second.removed).toEqual([]);
    expect(entries("basic-course")).toEqual(before);
  });

  test("WHEN a move would overwrite an existing path THEN it throws without moving", () => {
    writeImportedCourse();
    mkfile("basic-course/2 Vowels/placeholder.txt");

    expect(() =>
      reshapeCourseTree({ rootDir: root, plans: [IMPORTED_PLAN()], apply: true }),
    ).toThrow(/2 Vowels/);
    expect(exists("basic-course/2 Sounds/1 Vowels/1 Schwa/schwa.mp4")).toBe(true);
  });

  test("WHEN a course folder has no plan THEN it is left untouched", () => {
    writeImportedCourse();
    mkfile("advanced-course/1 Module/1 Lesson/readme.md", "# Untouched");
    mkfile("advanced-course/1 Module/1 Lesson/resources/keep.pdf");

    reshapeCourseTree({ rootDir: root, plans: [IMPORTED_PLAN()], apply: true });

    expect(exists("advanced-course/1 Module/1 Lesson/resources/keep.pdf")).toBe(true);
    expect(
      readFileSync(path.join(root, "advanced-course/1 Module/1 Lesson/readme.md"), "utf8"),
    ).toBe("# Untouched");
  });
});
