import { LessonId as LessonIdSchema } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { makeMarkLessonComplete } from "@/domain/use-cases/mark-lesson-complete/mark-lesson-complete";
import { makeStubLessonRepository, makeStubProgressTracker } from "@/test-setup/stubs/domain-repos";

import { faker } from "@faker-js/faker";
import { describe, expect, test, vi } from "vitest";

const fixtureLesson = () =>
  Lesson.parse({
    kind: "reading",
    id: faker.string.uuid(),
    courseId: faker.string.uuid(),
    moduleId: faker.string.uuid(),
    sequence: 1,
    title: faker.lorem.sentence(),
    body: faker.lorem.paragraph(),
  });

describe("markLessonComplete", () => {
  describe("GIVEN a lesson that exists", () => {
    test("WHEN the use case runs THEN it resolves with { completed: true }", async () => {
      // Arrange
      const lesson = fixtureLesson();
      const tracker = makeStubProgressTracker();
      const useCase = makeMarkLessonComplete({
        lessons: makeStubLessonRepository({ lessons: [lesson] }),
        progress: tracker,
      });

      // Act
      const result = await useCase({ lessonId: lesson.id });

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual({ completed: true });
      }
    });

    test("WHEN the use case runs THEN the progress tracker is written to", async () => {
      // Arrange
      const lesson = fixtureLesson();
      const tracker = makeStubProgressTracker();
      const markSpy = vi.spyOn(tracker, "markComplete");
      const useCase = makeMarkLessonComplete({
        lessons: makeStubLessonRepository({ lessons: [lesson] }),
        progress: tracker,
      });

      // Act
      await useCase({ lessonId: lesson.id });

      // Assert
      expect(markSpy).toHaveBeenCalledWith(lesson.id);
    });

    test("WHEN the use case runs THEN the tracker is observably complete after resolution", async () => {
      // Arrange — guards against the fire-and-forget regression where the
      // use case returned ok before the underlying write resolved.
      const lesson = fixtureLesson();
      const tracker = makeStubProgressTracker();
      const useCase = makeMarkLessonComplete({
        lessons: makeStubLessonRepository({ lessons: [lesson] }),
        progress: tracker,
      });

      // Act
      const result = await useCase({ lessonId: lesson.id });

      // Assert — both the result AND the observable tracker state must agree.
      expect(result.isOk()).toBe(true);
      expect(await tracker.isComplete(lesson.id)).toBe(true);
    });

    test("WHEN the progress tracker rejects THEN the use case resolves with internal-error", async () => {
      // Arrange — a tracker whose write rejects. The use case must surface
      // the failure rather than swallow it.
      const lesson = fixtureLesson();
      const tracker: ReturnType<typeof makeStubProgressTracker> = {
        markComplete: async () => {
          throw new Error("tracker write failed");
        },
        isComplete: async () => false,
      };
      const useCase = makeMarkLessonComplete({
        lessons: makeStubLessonRepository({ lessons: [lesson] }),
        progress: tracker,
      });

      // Act
      const result = await useCase({ lessonId: lesson.id });

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.kind).toBe("internal-error");
      }
    });
  });

  describe("GIVEN a lessonId that does not exist", () => {
    test("WHEN the use case runs THEN it resolves with lesson-not-found", async () => {
      // Arrange
      const missing = LessonIdSchema.parse(faker.string.uuid());
      const useCase = makeMarkLessonComplete({
        lessons: makeStubLessonRepository({ lessons: [] }),
        progress: makeStubProgressTracker(),
      });

      // Act
      const result = await useCase({ lessonId: missing });

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toEqual({ kind: "lesson-not-found" });
      }
    });
  });
});
