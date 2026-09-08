import { parseCourseManifests } from "@/adapters/persistence/content-manifest/course-manifest-schema/course-manifest-schema";
import { flattenCourseManifests } from "@/adapters/persistence/content-manifest/flatten-course-manifests/flatten-course-manifests";

import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

const COURSE_ID = faker.string.uuid();
const MODULE_ID = faker.string.uuid();
const LESSON_ID = faker.string.uuid();
const RESOURCE_ID = faker.string.uuid();

function videoLesson(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    kind: "video",
    id: LESSON_ID,
    slug: "1-the-vowel-sound-schwa",
    sequence: 1,
    title: faker.lorem.sentence(),
    description: faker.lorem.sentence(),
    source: "basic-course/2-vowels/1-schwa/lecture.mp4",
    durationSeconds: 663,
    resources: [],
    ...overrides,
  };
}

/** One course with one module holding `lessons`, parsed into manifest shape. */
function catalogOf(lessons: ReadonlyArray<Record<string, unknown>>) {
  return parseCourseManifests([
    {
      id: COURSE_ID,
      slug: "basic-course",
      title: "Basic Course",
      description: faker.lorem.sentence(),
      language: "en",
      sequence: 1,
      modules: [
        {
          id: MODULE_ID,
          slug: "2-vowels",
          title: "Vowels",
          sequence: 1,
          lessons,
        },
      ],
    },
  ]);
}

describe("flattenCourseManifests", () => {
  describe("GIVEN a nested manifest", () => {
    test("WHEN it is flattened THEN counts are derived from the nesting", () => {
      const { courses } = flattenCourseManifests(
        catalogOf([videoLesson(), videoLesson({ id: faker.string.uuid(), sequence: 2 })]),
      );

      expect(courses[0]).toMatchObject({ lessonCount: 2, moduleCount: 1 });
    });

    test("WHEN it is flattened THEN parent ids are propagated down the tree", () => {
      const lesson = videoLesson({
        resources: [
          {
            id: RESOURCE_ID,
            title: "Notes",
            url: "basic-course/2-vowels/1-schwa/readme.md",
            kind: "other",
          },
        ],
      });

      const { modules, lessonRows, resourceRows } = flattenCourseManifests(catalogOf([lesson]));

      expect(modules[0]).toMatchObject({ courseId: COURSE_ID });
      expect(lessonRows[0]).toMatchObject({ courseId: COURSE_ID, moduleId: MODULE_ID });
      expect(resourceRows[0]).toMatchObject({ lessonId: LESSON_ID });
    });

    test("WHEN lessons are declared in order THEN the rows keep that order", () => {
      const second = faker.string.uuid();
      const third = faker.string.uuid();

      const { lessonRows } = flattenCourseManifests(
        catalogOf([
          videoLesson(),
          videoLesson({ id: second, sequence: 2 }),
          videoLesson({ id: third, sequence: 3 }),
        ]),
      );

      expect(lessonRows.map((row) => row.id)).toEqual([LESSON_ID, second, third]);
    });
  });

  describe("GIVEN lessons that do and do not declare notes", () => {
    test("WHEN flattened THEN only the declared ones appear in notesKeys", () => {
      const notesKey = "basic-course/2-vowels/1-schwa/readme.md";
      const withoutNotes = faker.string.uuid();

      const { notesKeys } = flattenCourseManifests(
        catalogOf([videoLesson({ notesKey }), videoLesson({ id: withoutNotes, sequence: 2 })]),
      );

      expect(notesKeys).toEqual({ [LESSON_ID]: notesKey });
    });
  });

  describe("GIVEN a reading lesson", () => {
    test("WHEN flattened THEN its row carries the body and no source", () => {
      const body = faker.lorem.paragraph();
      const reading = {
        kind: "reading",
        id: LESSON_ID,
        slug: "1-welcome",
        sequence: 1,
        title: faker.lorem.sentence(),
        body,
        resources: [],
      };

      const { lessonRows } = flattenCourseManifests(catalogOf([reading]));

      expect(lessonRows[0]).toMatchObject({ kind: "reading", body });
      expect(lessonRows[0]).not.toHaveProperty("source");
    });
  });
});
