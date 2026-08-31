import { Course } from "@/domain/entities/course/course";
import { CourseId, LessonId, ModuleId } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { Module } from "@/domain/entities/module/module";

import { faker } from "@faker-js/faker";
import { beforeEach, describe, expect, test, vi } from "vitest";

/**
 * The action runs through `next-safe-action`, so a result carries either
 * `data` (the body ran) or `validationErrors` (the schema rejected the input
 * and the body never ran). A stale location is NOT a validation error: it is
 * well-formed input that no longer resolves, and the action reports that as
 * `data: null` so the home can render nothing without inspecting an error.
 */
const mockFindContinueWatching = vi.fn();

vi.mock("@/adapters/persistence/in-memory/use-case-dependencies/use-case-dependencies", () => ({
  getCoursePlatformDeps: () => ({
    useCases: { findContinueWatching: mockFindContinueWatching },
  }),
}));

const okResult = <T>(value: T) => ({ isOk: () => true, isErr: () => false, value });
const errResult = <E>(error: E) => ({ isOk: () => false, isErr: () => true, error });

const course = Course.parse({
  id: CourseId.parse(faker.string.uuid()),
  slug: "a-course",
  title: "A Course",
  description: "Desc",
  language: "en",
  lessonCount: 2,
  moduleCount: 1,
  sequence: 1,
});
const module_ = Module.parse({
  id: ModuleId.parse(faker.string.uuid()),
  courseId: course.id,
  slug: "a-module",
  title: "A Module",
  sequence: 1,
});
const videoLesson = Lesson.parse({
  kind: "video",
  id: LessonId.parse(faker.string.uuid()),
  courseId: course.id,
  moduleId: module_.id,
  sequence: 1,
  title: "Vowels: short vs. long",
  description: "Desc",
  source: "/videos/vowels.mp4",
  durationSeconds: 600,
});
const readingLesson = Lesson.parse({
  kind: "reading",
  id: LessonId.parse(faker.string.uuid()),
  courseId: course.id,
  moduleId: module_.id,
  sequence: 2,
  title: "Drills: minimal pairs",
  body: "Body",
});

const validInput = {
  courseSlug: course.slug,
  moduleSlug: module_.slug,
  lessonId: videoLesson.id,
};

describe("findContinueWatchingAction", () => {
  beforeEach(() => {
    mockFindContinueWatching.mockReset();
  });

  describe("GIVEN a location that still resolves", () => {
    test("WHEN the use case returns ok THEN the action returns what the panel renders", async () => {
      // Arrange
      mockFindContinueWatching.mockResolvedValue(
        okResult({ course, module: module_, lesson: videoLesson }),
      );
      const { findContinueWatchingAction } = await import("./actions");

      // Act
      const result = await findContinueWatchingAction(validInput);

      // Assert
      expect(result?.data).toEqual({
        courseTitle: course.title,
        moduleTitle: module_.title,
        lessonTitle: videoLesson.title,
        lessonHref: `/courses/${course.slug}/modules/${module_.slug}/lessons/${videoLesson.id}`,
        durationSeconds: 600,
      });
    });

    test("WHEN the lesson is a reading lesson THEN it carries no duration", async () => {
      // Arrange
      // Without a duration there is nothing to compute a progress bar from,
      // and the panel must omit it rather than render it at zero.
      mockFindContinueWatching.mockResolvedValue(
        okResult({ course, module: module_, lesson: readingLesson }),
      );
      const { findContinueWatchingAction } = await import("./actions");

      // Act
      const result = await findContinueWatchingAction({
        ...validInput,
        lessonId: readingLesson.id,
      });

      // Assert
      expect(result?.data?.durationSeconds).toBeNull();
      expect(result?.data?.lessonTitle).toBe(readingLesson.title);
    });
  });

  describe("GIVEN a location that no longer resolves", () => {
    test("WHEN the use case returns err THEN the action reports nothing to continue", async () => {
      // Arrange
      mockFindContinueWatching.mockResolvedValue(errResult({ kind: "lesson-not-in-module" }));
      const { findContinueWatchingAction } = await import("./actions");

      // Act
      const result = await findContinueWatchingAction(validInput);

      // Assert
      expect(result?.data).toBeNull();
      expect(result?.serverError).toBeUndefined();
    });
  });

  describe("GIVEN malformed input", () => {
    test("WHEN the lessonId is not a UUID THEN the schema rejects it and the use case never runs", async () => {
      // Arrange
      const { findContinueWatchingAction } = await import("./actions");

      // Act
      const result = await findContinueWatchingAction({
        ...validInput,
        lessonId: "not-a-uuid" as never,
      });

      // Assert
      expect(result?.validationErrors).toBeDefined();
      expect(mockFindContinueWatching).not.toHaveBeenCalled();
    });
  });
});
