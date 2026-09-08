import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
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
    expect(course.lessonVideoSources).toEqual({});
  });

  test("WHEN override maps are declared THEN they are carried through", () => {
    const declaration = {
      ...minimalCourse(),
      slugOverrides: { "1 Day#1": "1-day-01" },
      titleFromNotesModules: ["3-contractions-reductions"],
      moduleTitleOverrides: { "3-contractions-reductions": "Contractions & Reductions" },
      lessonTitleOverrides: { "3-contractions-reductions/6-i-d": "I’d, you’d, we’d" },
      lessonVideoSources: {
        "3-contractions-reductions/6-i-d": "https://www.youtube.com/embed/yY7RWGUbqng",
      },
    };
    const [parsed] = parseCoursesManifest(manifestText(declaration)).courses;

    const course = resolveCourseDeclaration(parsed!, CONTENT_ROOT);

    expect(course.slugOverrides).toEqual({ "1 Day#1": "1-day-01" });
    expect(course.titleFromNotesModules.has("3-contractions-reductions")).toBe(true);
    expect(course.moduleTitleOverrides["3-contractions-reductions"]).toBe(
      "Contractions & Reductions",
    );
    expect(course.lessonTitleOverrides["3-contractions-reductions/6-i-d"]).toBe("I’d, you’d, we’d");
    expect(course.lessonVideoSources["3-contractions-reductions/6-i-d"]).toBe(
      "https://www.youtube.com/embed/yY7RWGUbqng",
    );
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

describe("lessonVideoSources — table invariants", () => {
  const YOUTUBE_EMBED = "https://www.youtube.com/embed/yY7RWGUbqng";

  function textWithSource(key: string, value: string): string {
    return manifestText({ ...minimalCourse(), lessonVideoSources: { [key]: value } });
  }

  test("WHEN a lesson declares an external video URL THEN it is parsed", () => {
    const text = textWithSource("2-vowels/3-the-vowel-sound-uu", YOUTUBE_EMBED);

    const [course] = parseCoursesManifest(text).courses;

    expect(course?.lessonVideoSources).toEqual({
      "2-vowels/3-the-vowel-sound-uu": YOUTUBE_EMBED,
    });
  });

  test("WHEN a key is a bare lesson slug THEN it is rejected", () => {
    // Same reasoning as lessonTitleOverrides: "1-intro" exists in most
    // modules, so a bare key would repoint every one of them at once.
    const text = textWithSource("3-the-vowel-sound-uu", YOUTUBE_EMBED);

    expect(() => parseCoursesManifest(text)).toThrow(/moduleSlug\/lessonSlug/);
  });

  test("WHEN a key still carries the course segment THEN it is rejected", () => {
    const text = textWithSource("basic-course/2-vowels/3-the-vowel-sound-uu", YOUTUBE_EMBED);

    expect(() => parseCoursesManifest(text)).toThrow(/moduleSlug\/lessonSlug/);
  });

  test("WHEN a value is a content key THEN it is rejected", () => {
    // The whole point of the field is to escape the content store. A key
    // written here would resolve against the local store and play the very
    // file the entry exists to replace — silently.
    const text = textWithSource(
      "2-vowels/3-the-vowel-sound-uu",
      "basic-course/2-vowels/3-the-vowel-sound-uu/the-vowel-sound.mp4",
    );

    expect(() => parseCoursesManifest(text)).toThrow(/absolute http\(s\) URL/);
  });

  test("WHEN a value is a site-relative path THEN it is rejected", () => {
    const text = textWithSource("2-vowels/3-the-vowel-sound-uu", "/local-filesystem-lesson/x.mp4");

    expect(() => parseCoursesManifest(text)).toThrow(/absolute http\(s\) URL/);
  });

  test("WHEN a value uses a scheme other than http(s) THEN it is rejected", () => {
    const text = textWithSource("2-vowels/3-the-vowel-sound-uu", "ftp://example.com/video.mp4");

    expect(() => parseCoursesManifest(text)).toThrow(/absolute http\(s\) URL/);
  });

  test("WHEN a value is a plain http URL THEN it is accepted", () => {
    const text = textWithSource("2-vowels/3-the-vowel-sound-uu", "http://example.com/video.mp4");

    expect(() => parseCoursesManifest(text)).not.toThrow();
  });
});
