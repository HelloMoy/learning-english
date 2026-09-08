import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { faker } from "@faker-js/faker";
import { afterAll, describe, expect, test } from "vitest";

import {
  loadCoursesManifest,
  parseCoursesManifest,
  resolveCourseDeclaration,
  resolveCoursesManifest,
} from "./courses-manifest";

/** A manifest document with one fully-specified course entry. */
function manifestText(course: Record<string, unknown>): string {
  return JSON.stringify({ version: 1, courses: [course] });
}

/** The smallest course entry the schema accepts. */
function minimalCourse(): Record<string, unknown> {
  return { folder: "advanced-intermediate-course", sequence: 2 };
}

describe("parseCoursesManifest", () => {
  test("WHEN the document is well-formed THEN it returns the declared courses", () => {
    const title = faker.lorem.words(3);
    const text = manifestText({ ...minimalCourse(), title });

    const manifest = parseCoursesManifest(text);

    expect(manifest.courses).toHaveLength(1);
    expect(manifest.courses[0]?.folder).toBe("advanced-intermediate-course");
    expect(manifest.courses[0]?.title).toBe(title);
  });

  test("WHEN a course omits `folder` THEN it throws naming the missing field", () => {
    const text = manifestText({ sequence: 2 });

    expect(() => parseCoursesManifest(text)).toThrow(/folder/);
  });

  test("WHEN a course omits `sequence` THEN it throws naming the missing field", () => {
    const text = manifestText({ folder: "advanced-intermediate-course" });

    expect(() => parseCoursesManifest(text)).toThrow(/sequence/);
  });

  test("WHEN the document is not valid JSON THEN it throws saying so", () => {
    expect(() => parseCoursesManifest("{ not json")).toThrow(/not valid JSON/);
  });
});

describe("resolveCourseDeclaration", () => {
  const CONTENT_ROOT = "public/local-filesystem-lesson";

  test("WHEN only the required fields are declared THEN every optional one is derived", () => {
    const [declaration] = parseCoursesManifest(manifestText(minimalCourse())).courses;

    const course = resolveCourseDeclaration(declaration!, CONTENT_ROOT);

    expect(course).toMatchObject({
      folder: "advanced-intermediate-course",
      slug: "advanced-intermediate-course",
      title: "Advanced Intermediate Course",
      description: "Course content generated from public/local-filesystem-lesson.",
      language: "en",
      sequence: 2,
    });
  });

  test("WHEN the folder name is not URL-safe THEN the derived slug is slugified", () => {
    const declaration = { folder: "5 Sound Natural: American Intonation", sequence: 3 };

    const course = resolveCourseDeclaration(declaration, CONTENT_ROOT);

    expect(course.slug).toBe("5-sound-natural-american-intonation");
  });

  test("WHEN a field is declared THEN the declared value wins over the derived one", () => {
    const declaration = {
      folder: "advanced-intermediate-course",
      sequence: 2,
      slug: "advanced-course",
      title: faker.lorem.words(3),
      description: faker.lorem.sentence(),
      language: "es",
    };

    const course = resolveCourseDeclaration(declaration, CONTENT_ROOT);

    expect(course).toMatchObject(declaration);
  });

  test("WHEN no override maps are declared THEN they resolve to empty collections", () => {
    const course = resolveCourseDeclaration(minimalCourse() as never, CONTENT_ROOT);

    expect(course.slugOverrides).toEqual({});
    expect(course.lessonTitleOverrides).toEqual({});
    expect(course.moduleTitleOverrides).toEqual({});
    expect(course.titleFromNotesModules.size).toBe(0);
  });

  test("WHEN override maps are declared THEN they are carried through", () => {
    const declaration = {
      ...minimalCourse(),
      slugOverrides: { "1 Day#1": "1-day-01" },
      titleFromNotesModules: ["3-contractions-reductions"],
      moduleTitleOverrides: { "3-contractions-reductions": "Contractions & Reductions" },
      lessonTitleOverrides: { "3-contractions-reductions/6-i-d": "I’d, you’d, we’d" },
    };
    const [parsed] = parseCoursesManifest(manifestText(declaration)).courses;

    const course = resolveCourseDeclaration(parsed!, CONTENT_ROOT);

    expect(course.slugOverrides).toEqual({ "1 Day#1": "1-day-01" });
    expect(course.titleFromNotesModules.has("3-contractions-reductions")).toBe(true);
    expect(course.moduleTitleOverrides["3-contractions-reductions"]).toBe(
      "Contractions & Reductions",
    );
    expect(course.lessonTitleOverrides["3-contractions-reductions/6-i-d"]).toBe("I’d, you’d, we’d");
  });
});

describe("resolveCoursesManifest — cross-entry invariants", () => {
  const CONTENT_ROOT = "public/local-filesystem-lesson";

  function textFor(courses: Array<Record<string, unknown>>): string {
    return JSON.stringify({ version: 1, courses });
  }

  test("WHEN two courses resolve to the same slug THEN it throws naming both folders", () => {
    const text = textFor([
      { folder: "Intro", sequence: 1 },
      { folder: "intro!", sequence: 2 },
    ]);

    expect(() => resolveCoursesManifest(text, CONTENT_ROOT)).toThrow(
      /Intro[\s\S]*intro!|intro![\s\S]*Intro/,
    );
  });

  test("WHEN two courses claim the same ladder position THEN it throws naming both folders", () => {
    const text = textFor([
      { folder: "first-course", sequence: 2 },
      { folder: "second-course", sequence: 2 },
    ]);

    expect(() => resolveCoursesManifest(text, CONTENT_ROOT)).toThrow(
      /first-course[\s\S]*second-course/,
    );
  });

  test("WHEN slugs and sequences are distinct THEN it returns the courses in sequence order", () => {
    const text = textFor([
      { folder: "second-course", sequence: 2 },
      { folder: "first-course", sequence: 1 },
    ]);

    const courses = resolveCoursesManifest(text, CONTENT_ROOT);

    expect(courses.map((course) => course.folder)).toEqual(["first-course", "second-course"]);
  });
});

describe("loadCoursesManifest", () => {
  const root = mkdtempSync(path.join(tmpdir(), "courses-manifest-test-"));

  afterAll(() => rmSync(root, { recursive: true, force: true }));

  /** Writes a manifest into a fresh content root and returns its path. */
  function contentRootWith(courses: Array<Record<string, unknown>>, folders: string[]): string {
    const contentRoot = mkdtempSync(path.join(root, "root-"));
    for (const folder of folders) {
      mkdirSync(path.join(contentRoot, folder), { recursive: true });
    }
    writeFileSync(
      path.join(contentRoot, "courses.manifest.json"),
      JSON.stringify({ version: 1, courses }),
    );
    return contentRoot;
  }

  test("WHEN the content root has no manifest THEN it returns null", () => {
    const contentRoot = mkdtempSync(path.join(root, "root-"));

    expect(loadCoursesManifest(contentRoot)).toBeNull();
  });

  test("WHEN every declared folder exists THEN it returns the resolved courses", () => {
    const contentRoot = contentRootWith(
      [{ folder: "first-course", sequence: 1 }],
      ["first-course"],
    );

    const courses = loadCoursesManifest(contentRoot);

    expect(courses).toHaveLength(1);
    expect(courses?.[0]?.slug).toBe("first-course");
  });

  test("WHEN a declared folder is missing THEN it throws naming that folder", () => {
    const contentRoot = contentRootWith([{ folder: "does-not-exist", sequence: 1 }], []);

    expect(() => loadCoursesManifest(contentRoot)).toThrow(/does-not-exist/);
  });
});

describe("lessonTitleOverrides — table invariants", () => {
  function textWithOverride(key: string, value: string): string {
    return manifestText({ ...minimalCourse(), lessonTitleOverrides: { [key]: value } });
  }

  test("WHEN a value uses the straight apostrophe THEN it is rejected", () => {
    // Overrides are hand-written and deliberately NOT normalized, so the
    // schema is what keeps the table honest instead of silently repairing it.
    const text = textWithOverride("3-contractions/6-i-d", "I'd, you'd, we'd");

    expect(() => parseCoursesManifest(text)).toThrow(/U\+2019/);
  });

  test("WHEN a value uses the typographic apostrophe THEN it is accepted", () => {
    const text = textWithOverride("3-contractions/6-i-d", "I’d, you’d, we’d");

    expect(() => parseCoursesManifest(text)).not.toThrow();
  });

  test("WHEN a key is a bare lesson slug THEN it is rejected", () => {
    // "1-intro" exists in most modules; a bare key would rename all of them.
    const text = textWithOverride("1-intro", "Introduction");

    expect(() => parseCoursesManifest(text)).toThrow(/moduleSlug\/lessonSlug/);
  });

  test("WHEN a key still carries the course segment THEN it is rejected", () => {
    const text = textWithOverride("advanced-course/3-contractions/6-i-d", "I’d");

    expect(() => parseCoursesManifest(text)).toThrow(/moduleSlug\/lessonSlug/);
  });

  test("WHEN a value is not trimmed THEN it is rejected", () => {
    const text = textWithOverride("3-contractions/6-i-d", "  Padded  ");

    expect(() => parseCoursesManifest(text)).toThrow(/trimmed/);
  });
});

describe("moduleTitleOverrides — table invariants", () => {
  function textWithOverride(key: string, value: string): string {
    return manifestText({ ...minimalCourse(), moduleTitleOverrides: { [key]: value } });
  }

  test("WHEN a value restores accents humanize would strip THEN it is accepted", () => {
    const text = textWithOverride("4-ejercicios-de-ritmo", "Ejercicios para dominar el ritmo");

    expect(() => parseCoursesManifest(text)).not.toThrow();
  });

  test("WHEN a value uses the straight apostrophe THEN it is rejected", () => {
    const text = textWithOverride("3-contractions", "Let's Contract");

    expect(() => parseCoursesManifest(text)).toThrow(/U\+2019/);
  });

  test("WHEN a value is not trimmed THEN it is rejected", () => {
    const text = textWithOverride("3-contractions", "  Padded  ");

    expect(() => parseCoursesManifest(text)).toThrow(/trimmed/);
  });

  test("WHEN a key carries a lesson segment THEN it is rejected", () => {
    // The table names modules; a two-segment key is a lessonTitleOverrides
    // entry written into the wrong table, and would silently never match.
    const text = textWithOverride("3-contractions/6-i-d", "I’d");

    expect(() => parseCoursesManifest(text)).toThrow(/module slug/);
  });

  test("WHEN a key still carries the course segment THEN it is rejected", () => {
    const text = textWithOverride("advanced-course/3-contractions", "Contractions");

    expect(() => parseCoursesManifest(text)).toThrow(/module slug/);
  });
});

describe("courses.manifest.example.json", () => {
  test("WHEN the tracked template is parsed THEN it satisfies the schema", () => {
    // The live manifest is untracked, so this file is the only record in git
    // of what a working one looks like. It must never drift out of shape.
    const text = readFileSync(path.join("scripts", "courses.manifest.example.json"), "utf8");

    expect(() => parseCoursesManifest(text)).not.toThrow();
  });

  test("WHEN the template is resolved THEN it declares the shipped courses in ladder order", () => {
    const text = readFileSync(path.join("scripts", "courses.manifest.example.json"), "utf8");

    const courses = resolveCoursesManifest(text, "public/local-filesystem-lesson");

    expect(courses.map((course) => course.slug)).toEqual([
      "basic-course",
      "advanced-intermediate-course",
    ]);
    expect(courses[0]).toMatchObject({
      folder: "basic-course",
      title: "Basic Course",
      language: "en",
      sequence: 2,
    });
    expect(courses[1]).toMatchObject({
      folder: "advanced-intermediate-course",
      title: "Advanced Intermediate Course",
      description: "Course content generated from public/local-filesystem-lesson.",
      language: "en",
      sequence: 3,
    });
  });
});
