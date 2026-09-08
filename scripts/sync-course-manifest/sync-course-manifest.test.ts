import { describe, expect, test } from "vitest";

import { mergeDiscoveredLessons, type DiscoveredLesson } from "./sync-course-manifest.ts";

const LESSON_ID = "c460d8c1-4511-5f35-a2a4-a0e701393e30";
const NEW_LESSON_ID = "11111111-2222-5333-8444-555555555555";

function manifestWith(lessons: ReadonlyArray<Record<string, unknown>>): Record<string, unknown> {
  return {
    id: "a0cf4018-5475-5f12-9363-efedaa8782b8",
    slug: "basic-course",
    title: "Basic Course",
    description: "…",
    language: "en",
    sequence: 1,
    modules: [
      {
        id: "b7029577-0f28-5a5f-9ada-ffee1ef1bf5b",
        slug: "2-vowels",
        title: "Vowels",
        sequence: 1,
        lessons,
      },
    ],
  };
}

function declaredLesson(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: LESSON_ID,
    slug: "1-the-vowel-sound-schwa",
    sequence: 1,
    title: "The Vowel Sound: /ə/",
    kind: "video",
    description: "…",
    source: "https://www.youtube.com/embed/27WXXMFimvE",
    durationSeconds: 663,
    resources: [],
    ...overrides,
  };
}

function discovered(overrides: Record<string, unknown> = {}): DiscoveredLesson {
  return {
    moduleSlug: "2-vowels",
    moduleTitle: "Vowels",
    moduleSequence: 1,
    moduleId: "b7029577-0f28-5a5f-9ada-ffee1ef1bf5b",
    lesson: {
      id: NEW_LESSON_ID,
      slug: "2-the-vowel-sound-ih",
      sequence: 2,
      title: "The Vowel Sound /ɪ/",
      kind: "video",
      description: "…",
      source: "basic-course/2-vowels/2-the-vowel-sound-ih/lecture.mp4",
      durationSeconds: 535,
      resources: [],
      ...(overrides.lesson as Record<string, unknown> | undefined),
    },
    ...overrides,
  };
}

describe("mergeDiscoveredLessons", () => {
  describe("GIVEN a lesson the manifest does not describe", () => {
    test("WHEN merged THEN it is appended to its module", () => {
      const manifest = manifestWith([declaredLesson()]);

      const report = mergeDiscoveredLessons(manifest, [discovered()]);

      const modules = report.manifest.modules as Array<Record<string, unknown>>;
      const lessons = modules[0]!.lessons as Array<Record<string, unknown>>;
      expect(lessons.map((lesson) => lesson.id)).toEqual([LESSON_ID, NEW_LESSON_ID]);
      expect(report.appendedLessons).toEqual(["2-vowels/2-the-vowel-sound-ih"]);
    });

    test("WHEN its module is not declared THEN the module is appended too", () => {
      const manifest = manifestWith([declaredLesson()]);
      const inNewModule = discovered({
        moduleSlug: "3-consonants",
        moduleTitle: "Consonants",
        moduleSequence: 2,
        moduleId: "99999999-8888-5777-8666-555555555555",
      });

      const report = mergeDiscoveredLessons(manifest, [inNewModule]);

      const modules = report.manifest.modules as Array<Record<string, unknown>>;
      expect(modules.map((courseModule) => courseModule.slug)).toEqual([
        "2-vowels",
        "3-consonants",
      ]);
      expect(report.appendedModules).toEqual(["3-consonants"]);
    });
  });

  describe("GIVEN a lesson the manifest already describes", () => {
    test("WHEN merged THEN the hand-edited entry is untouched", () => {
      const handEdited = declaredLesson({
        title: "A title someone wrote by hand",
        source: "https://www.youtube.com/embed/HANDEDITED",
      });
      const manifest = manifestWith([handEdited]);
      const before = JSON.stringify(manifest);

      const report = mergeDiscoveredLessons(manifest, [
        discovered({
          lesson: {
            id: LESSON_ID,
            slug: "1-the-vowel-sound-schwa",
            sequence: 1,
            title: "A title derived from disk",
            kind: "video",
            description: "…",
            source: "basic-course/2-vowels/1-the-vowel-sound-schwa/lecture.mp4",
            durationSeconds: 663,
            resources: [],
          },
        }),
      ]);

      expect(JSON.stringify(report.manifest)).toBe(before);
      expect(report.appendedLessons).toEqual([]);
    });
  });

  describe("GIVEN a discovered lesson with no local video", () => {
    test("WHEN merged THEN it is appended with a null duration and reported", () => {
      const manifest = manifestWith([declaredLesson()]);
      const noVideo = discovered({
        lesson: {
          id: NEW_LESSON_ID,
          slug: "2-reading-only",
          sequence: 2,
          title: "Reading only",
          kind: "video",
          description: "…",
          source: "basic-course/2-vowels/2-reading-only/lecture.mp4",
          durationSeconds: null,
          resources: [],
        },
      });

      const report = mergeDiscoveredLessons(manifest, [noVideo]);

      const modules = report.manifest.modules as Array<Record<string, unknown>>;
      const lessons = modules[0]!.lessons as Array<Record<string, unknown>>;
      expect(lessons[1]!.durationSeconds).toBeNull();
      expect(report.lessonsMissingDuration).toEqual(["2-vowels/2-reading-only"]);
    });
  });

  describe("GIVEN nothing new on disk", () => {
    test("WHEN merged THEN the manifest is byte-identical and nothing is reported", () => {
      const manifest = manifestWith([declaredLesson()]);
      const before = JSON.stringify(manifest);

      const report = mergeDiscoveredLessons(manifest, []);

      expect(JSON.stringify(report.manifest)).toBe(before);
      expect(report.appendedLessons).toEqual([]);
      expect(report.appendedModules).toEqual([]);
      expect(report.lessonsMissingDuration).toEqual([]);
    });
  });
});
