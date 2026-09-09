import {
  InvalidCourseManifestError,
  parseCourseManifests,
} from "@/adapters/persistence/content-manifest/course-manifest-schema/course-manifest-schema";

import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

/**
 * A lesson every test can start from. Callers override only the field under
 * test, so a failure names the field rather than the fixture.
 */
function videoLesson(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    kind: "video",
    id: faker.string.uuid(),
    slug: "1-the-vowel-sound-schwa",
    sequence: 1,
    title: faker.lorem.sentence(),
    description: faker.lorem.sentence(),
    source: "basic-course/2-vowels/1-the-vowel-sound-schwa/lecture.mp4",
    durationSeconds: 663,
    resources: [],
    ...overrides,
  };
}

function courseManifest(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: faker.string.uuid(),
    slug: "basic-course",
    title: faker.lorem.words(2),
    description: faker.lorem.sentence(),
    language: "en",
    sequence: 1,
    modules: [
      {
        id: faker.string.uuid(),
        slug: "2-vowels",
        title: faker.lorem.words(2),
        sequence: 1,
        lessons: [videoLesson()],
      },
    ],
    ...overrides,
  };
}

/** A manifest whose single lesson carries `overrides`. */
function manifestWithLesson(overrides: Record<string, unknown>): Record<string, unknown> {
  const manifest = courseManifest();
  const modules = manifest.modules as Array<Record<string, unknown>>;
  modules[0]!.lessons = [videoLesson(overrides)];
  return manifest;
}

describe("parseCourseManifests", () => {
  describe("GIVEN a well-formed manifest", () => {
    test("WHEN it is parsed THEN it returns the declared courses in order", () => {
      const first = courseManifest({ slug: "basic-course", sequence: 1 });
      const second = courseManifest({ slug: "advanced-course", sequence: 2 });

      const parsed = parseCourseManifests([first, second]);

      expect(parsed.map((course) => course.slug)).toEqual(["basic-course", "advanced-course"]);
    });

    test("WHEN a lesson declares a YouTube source THEN it survives verbatim", () => {
      const source = "https://www.youtube.com/embed/27WXXMFimvE";

      const [course] = parseCourseManifests([manifestWithLesson({ source })]);

      expect(course!.modules[0]!.lessons[0]).toMatchObject({ kind: "video", source });
    });
  });

  describe("GIVEN a lesson with no usable duration", () => {
    test.each([
      ["absent", undefined],
      ["null", null],
      ["zero", 0],
    ])("WHEN durationSeconds is %s THEN it is rejected naming the lesson", (_label, value) => {
      const manifest = manifestWithLesson({ durationSeconds: value, slug: "4-fast-ae" });

      expect(() => parseCourseManifests([manifest])).toThrow(InvalidCourseManifestError);
      expect(() => parseCourseManifests([manifest])).toThrow(/4-fast-ae/);
    });
  });

  describe("GIVEN a source that is neither an absolute URL nor a content key", () => {
    test.each([
      ["empty", ""],
      ["site-relative", "/videos/lecture.mp4"],
      ["traversal", "../../etc/passwd"],
    ])("WHEN the source is %s THEN it is rejected naming the lesson", (_label, source) => {
      const manifest = manifestWithLesson({ source, slug: "9-broken-source" });

      expect(() => parseCourseManifests([manifest])).toThrow(InvalidCourseManifestError);
      expect(() => parseCourseManifests([manifest])).toThrow(/9-broken-source/);
    });
  });

  describe("GIVEN a course declaring whether it is a draft", () => {
    test("WHEN `draft` is absent THEN the course is published", () => {
      const [course] = parseCourseManifests([courseManifest()]);

      expect(course!.draft).toBe(false);
    });

    test("WHEN `draft` is true THEN it survives the parse", () => {
      const [course] = parseCourseManifests([courseManifest({ draft: true })]);

      expect(course!.draft).toBe(true);
    });

    test("WHEN `draft` is not a boolean THEN it is rejected naming the course", () => {
      const manifest = courseManifest({ draft: "yes", slug: "half-written-course" });

      expect(() => parseCourseManifests([manifest])).toThrow(InvalidCourseManifestError);
      expect(() => parseCourseManifests([manifest])).toThrow(/half-written-course/);
    });
  });

  describe("GIVEN two courses colliding on the ladder", () => {
    test("WHEN two manifests share a slug THEN it is rejected naming both", () => {
      const manifests = [
        courseManifest({ slug: "basic-course", sequence: 1 }),
        courseManifest({ slug: "basic-course", sequence: 2 }),
      ];

      expect(() => parseCourseManifests(manifests)).toThrow(/basic-course/);
    });

    test("WHEN two manifests share a sequence THEN it is rejected naming both", () => {
      const manifests = [
        courseManifest({ slug: "basic-course", sequence: 1 }),
        courseManifest({ slug: "advanced-course", sequence: 1 }),
      ];

      expect(() => parseCourseManifests(manifests)).toThrow(
        /basic-course[\s\S]*advanced-course|advanced-course[\s\S]*basic-course/,
      );
    });

    test("WHEN slugs and sequences are distinct THEN both are accepted", () => {
      const manifests = [
        courseManifest({ slug: "basic-course", sequence: 1 }),
        courseManifest({ slug: "advanced-course", sequence: 2 }),
      ];

      expect(parseCourseManifests(manifests)).toHaveLength(2);
    });
  });
});

describe("uploadDate", () => {
  /**
   * Guards the `course-content-storage` capability's "a video lesson may
   * declare when it was published" requirement. The date exists so a Lecture
   * can be described as a schema.org `VideoObject`, which requires one —
   * emitting that type without a date produces markup validators reject, so
   * the field is optional and its absence is meaningful.
   */
  test("WHEN a video lesson declares no uploadDate THEN the manifest still parses", () => {
    expect(() => parseCourseManifests([courseManifest()])).not.toThrow();
  });

  test("WHEN a video lesson declares a calendar date THEN it survives verbatim", () => {
    const uploadDate = "2026-01-15";

    const [course] = parseCourseManifests([manifestWithLesson({ uploadDate })]);

    expect(course!.modules[0]!.lessons[0]).toMatchObject({ kind: "video", uploadDate });
  });

  test("WHEN an uploadDate is not a calendar date THEN it is refused, naming the lesson", () => {
    const manifest = manifestWithLesson({
      slug: "4-fast-ae",
      uploadDate: "15/01/2026",
    });

    expect(() => parseCourseManifests([manifest])).toThrow(InvalidCourseManifestError);
    expect(() => parseCourseManifests([manifest])).toThrow(/4-fast-ae/);
  });
});
