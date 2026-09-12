import { LessonId as LessonIdSchema } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { makeUnmarkLessonComplete } from "@/domain/use-cases/unmark-lesson-complete/unmark-lesson-complete";
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

describe("unmarkLessonComplete", () => {
  describe("GIVEN a lesson the learner had completed", () => {
    test("WHEN the use case runs THEN it resolves with { completed: false }", async () => {
      // Arrange
      const lesson = fixtureLesson();
      const tracker = makeStubProgressTracker();
      await tracker.markComplete(lesson.id);
      const useCase = makeUnmarkLessonComplete({
        lessons: makeStubLessonRepository({ lessons: [lesson] }),
        progress: tracker,
      });

      // Act
      const result = await useCase({ lessonId: lesson.id });

      // Assert
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual({ completed: false });
      }
    });

    test("WHEN the use case runs THEN the tracker is observably incomplete after resolution", async () => {
      // Arrange — the mirror of the mark use case's fire-and-forget guard:
      // the result must not arrive before the write has landed.
      const lesson = fixtureLesson();
      const tracker = makeStubProgressTracker();
      await tracker.markComplete(lesson.id);
      const unmarkSpy = vi.spyOn(tracker, "unmarkComplete");
      const useCase = makeUnmarkLessonComplete({
        lessons: makeStubLessonRepository({ lessons: [lesson] }),
        progress: tracker,
      });

      // Act
      await useCase({ lessonId: lesson.id });

      // Assert
      expect(unmarkSpy).toHaveBeenCalledWith(lesson.id);
      expect(await tracker.isComplete(lesson.id)).toBe(false);
    });

    test("WHEN the lesson was never marked THEN un-marking is still ok", async () => {
      // Arrange
      const lesson = fixtureLesson();
      const useCase = makeUnmarkLessonComplete({
        lessons: makeStubLessonRepository({ lessons: [lesson] }),
        progress: makeStubProgressTracker(),
      });

      // Act
      const result = await useCase({ lessonId: lesson.id });

      // Assert — idempotent, like marking.
      expect(result.isOk()).toBe(true);
    });

    test("WHEN the progress tracker rejects THEN the use case resolves with internal-error", async () => {
      // Arrange
      const lesson = fixtureLesson();
      const tracker: ReturnType<typeof makeStubProgressTracker> = {
        markComplete: async () => undefined,
        unmarkComplete: async () => {
          throw new Error("tracker write failed");
        },
        isComplete: async () => true,
      };
      const useCase = makeUnmarkLessonComplete({
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
    test("WHEN the use case runs THEN it resolves with lesson-not-found and writes nothing", async () => {
      // Arrange
      const missing = LessonIdSchema.parse(faker.string.uuid());
      const tracker = makeStubProgressTracker();
      const unmarkSpy = vi.spyOn(tracker, "unmarkComplete");
      const useCase = makeUnmarkLessonComplete({
        lessons: makeStubLessonRepository({ lessons: [] }),
        progress: tracker,
      });

      // Act
      const result = await useCase({ lessonId: missing });

      // Assert
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toEqual({ kind: "lesson-not-found" });
      }
      expect(unmarkSpy).not.toHaveBeenCalled();
    });
  });
});
