import { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import { Course } from "@/domain/entities/course/course";
import { LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Module } from "@/domain/entities/module/module";
import type {
  ModuleLesson,
  ModuleSummary,
} from "@/domain/use-cases/find-course-for-view/find-course-for-view";

import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import {
  courseOverviewProgress,
  type CourseOverviewEntry,
  type CourseOverviewProgressInput,
} from "./course-overview-progress";

const MINUTE = 60;
const LESSON_SECONDS = 10 * MINUTE;

const course = Course.parse({
  id: faker.string.uuid(),
  slug: "basic-course",
  title: faker.lorem.words(2),
  description: faker.lorem.sentence(),
  language: "en",
  lessonCount: 7,
  moduleCount: 3,
  sequence: 1,
});

const anEntry = (sequence: number, lessonCount: number): CourseOverviewEntry => {
  const courseModule = Module.parse({
    id: ModuleId.parse(faker.string.uuid()),
    courseId: course.id,
    slug: `module-${sequence}`,
    title: faker.lorem.words(2),
    sequence,
  });
  const lessons: ModuleLesson[] = Array.from({ length: lessonCount }, (_, index) => ({
    id: LessonId.parse(faker.string.uuid()),
    sequence: index + 1,
    title: faker.lorem.words(3),
    durationSeconds: LESSON_SECONDS,
  }));
  const summary: ModuleSummary = {
    moduleId: courseModule.id,
    lessonCount,
    totalDurationSeconds: lessonCount * LESSON_SECONDS,
    lessons,
  };
  return { module: courseModule, summary };
};

const entries = [anEntry(1, 2), anEntry(2, 3), anEntry(3, 2)];
const lessonAt = (moduleIndex: number, lessonIndex: number) =>
  entries[moduleIndex]!.summary.lessons[lessonIndex]!;
const idsOf = (moduleIndex: number) =>
  entries[moduleIndex]!.summary.lessons.map((lesson) => lesson.id);

const read = (overrides: Partial<CourseOverviewProgressInput> = {}) =>
  courseOverviewProgress({
    course,
    entries,
    location: null,
    completedIds: new Set<string>(),
    positions: new Map<string, number>(),
    ...overrides,
  });

const locationFor = (courseSlug: string, moduleSlug: string, lessonId: string) =>
  ContinueWatchingLocation.parse({ courseSlug, moduleSlug, lessonId });

describe("courseOverviewProgress", () => {
  describe("GIVEN the first lesson finished AND the second part-watched", () => {
    const completedIds = new Set(idsOf(0));
    const positions = new Map([[lessonAt(1, 0).id, 4 * MINUTE]]);

    test("WHEN progress is read THEN the course counts watched videos AND the time left", () => {
      // Act
      const progress = read({ completedIds, positions });

      // Assert
      expect(progress.course).toEqual({
        completedCount: 2,
        lessonCount: 7,
        completedFraction: 2 / 7,
        secondsLeft: 5 * LESSON_SECONDS - 4 * MINUTE,
      });
    });

    test("WHEN progress is read THEN each lesson carries its status, tally AND time left", () => {
      // Act
      const { modules } = read({ completedIds, positions });

      // Assert
      expect(
        modules.map(({ status, completedCount, lessonCount, secondsLeft }) => ({
          status,
          completedCount,
          lessonCount,
          secondsLeft,
        })),
      ).toEqual([
        { status: "completed", completedCount: 2, lessonCount: 2, secondsLeft: 0 },
        {
          status: "in-progress",
          completedCount: 0,
          lessonCount: 3,
          secondsLeft: 3 * LESSON_SECONDS - 4 * MINUTE,
        },
        {
          status: "not-started",
          completedCount: 0,
          lessonCount: 2,
          secondsLeft: 2 * LESSON_SECONDS,
        },
      ]);
    });

    test("WHEN progress is read THEN it continues the part-watched video AND marks its lesson current", () => {
      // Act
      const progress = read({ completedIds, positions });

      // Assert
      expect(progress.continueTarget).toEqual({
        kind: "continue",
        module: entries[1]!.module,
        lesson: lessonAt(1, 0),
        lessonNumber: 1,
      });
      expect(progress.modules.map((entry) => entry.isCurrent)).toEqual([false, true, false]);
    });
  });

  describe("GIVEN a learner with no progress", () => {
    test("WHEN progress is read THEN the course is started from its first video AND no lesson is current", () => {
      // Act
      const progress = read();

      // Assert
      expect(progress.continueTarget).toEqual({
        kind: "start",
        module: entries[0]!.module,
        lesson: lessonAt(0, 0),
        lessonNumber: 1,
      });
      expect(progress.course.completedFraction).toBe(0);
      expect(progress.modules.every((entry) => !entry.isCurrent)).toBe(true);
    });
  });

  describe("GIVEN a continue-watching record", () => {
    test("WHEN it names a live video of this course THEN that video is continued", () => {
      // Arrange
      const location = locationFor(course.slug, "module-3", lessonAt(2, 1).id);

      // Act
      const progress = read({ location, completedIds: new Set(idsOf(0)) });

      // Assert
      expect(progress.continueTarget).toEqual({
        kind: "continue",
        module: entries[2]!.module,
        lesson: lessonAt(2, 1),
        lessonNumber: 2,
      });
      expect(progress.modules.map((entry) => entry.isCurrent)).toEqual([false, false, true]);
    });

    test("WHEN it names another course THEN the first unfinished video of the lesson in progress is continued", () => {
      // Arrange
      const location = locationFor("other-course", "module-1", lessonAt(0, 0).id);
      const completedIds = new Set([lessonAt(1, 0).id, lessonAt(1, 1).id]);

      // Act
      const progress = read({ location, completedIds });

      // Assert
      expect(progress.continueTarget).toMatchObject({
        kind: "continue",
        lesson: lessonAt(1, 2),
        lessonNumber: 3,
      });
    });

    test("WHEN it names a video the learner already finished THEN the next unfinished video is continued", () => {
      // Arrange
      const location = locationFor(course.slug, "module-2", lessonAt(1, 0).id);
      const completedIds = new Set([...idsOf(0), lessonAt(1, 0).id]);

      // Act
      const progress = read({ location, completedIds });

      // Assert
      expect(progress.continueTarget).toEqual({
        kind: "continue",
        module: entries[1]!.module,
        lesson: lessonAt(1, 1),
        lessonNumber: 2,
      });
    });

    test("WHEN it names the finished last video of a lesson THEN the next lesson's first unfinished video is continued", () => {
      // Arrange
      const location = locationFor(course.slug, "module-2", lessonAt(1, 2).id);
      const completedIds = new Set([...idsOf(0), ...idsOf(1)]);

      // Act
      const progress = read({ location, completedIds });

      // Assert
      expect(progress.continueTarget).toMatchObject({
        kind: "continue",
        module: entries[2]!.module,
        lesson: lessonAt(2, 0),
      });
      expect(progress.modules.map((entry) => entry.isCurrent)).toEqual([false, false, true]);
    });

    test("WHEN it names a video that is not in the named lesson THEN it is ignored", () => {
      // Arrange
      const location = locationFor(course.slug, "module-1", lessonAt(1, 0).id);

      // Act
      const progress = read({ location });

      // Assert
      expect(progress.continueTarget).toMatchObject({ kind: "start", lesson: lessonAt(0, 0) });
    });
  });

  describe("GIVEN only the first lesson finished", () => {
    test("WHEN progress is read THEN the first video of the next untouched lesson is continued", () => {
      // Act
      const progress = read({ completedIds: new Set(idsOf(0)) });

      // Assert
      expect(progress.continueTarget).toMatchObject({
        kind: "continue",
        module: entries[1]!.module,
        lesson: lessonAt(1, 0),
      });
    });
  });

  describe("GIVEN no record AND progress in two lessons", () => {
    test("WHEN progress is read THEN the furthest progress anchors the video to continue", () => {
      // Arrange
      const positions = new Map([[lessonAt(0, 0).id, 2 * MINUTE]]);
      const completedIds = new Set([lessonAt(2, 0).id]);

      // Act
      const progress = read({ positions, completedIds });

      // Assert
      expect(progress.continueTarget).toMatchObject({
        kind: "continue",
        module: entries[2]!.module,
        lesson: lessonAt(2, 1),
      });
    });
  });

  describe("GIVEN every video watched", () => {
    test("WHEN progress is read THEN the course is watched again from its first video", () => {
      // Arrange
      const completedIds = new Set([...idsOf(0), ...idsOf(1), ...idsOf(2)]);

      // Act
      const progress = read({ completedIds });

      // Assert
      expect(progress.continueTarget).toMatchObject({ kind: "rewatch", lesson: lessonAt(0, 0) });
      expect(progress.course).toMatchObject({ completedFraction: 1, secondsLeft: 0 });
      expect(
        progress.modules.every((entry) => entry.status === "completed" && !entry.isCurrent),
      ).toBe(true);
    });
  });

  describe("GIVEN a course with no lessons", () => {
    test("WHEN progress is read THEN there is nothing to continue", () => {
      // Act
      const progress = courseOverviewProgress({
        course,
        entries: [],
        location: null,
        completedIds: new Set(),
        positions: new Map(),
      });

      // Assert
      expect(progress.continueTarget).toEqual({ kind: "none" });
      expect(progress.course).toEqual({
        completedCount: 0,
        lessonCount: 0,
        completedFraction: 0,
        secondsLeft: 0,
      });
    });
  });
});
