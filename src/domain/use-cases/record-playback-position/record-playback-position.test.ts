import { LessonId as LessonIdSchema } from "@/domain/entities/ids/ids";
import { Lesson } from "@/domain/entities/lesson/lesson";
import { makeRecordPlaybackPosition } from "@/domain/use-cases/record-playback-position/record-playback-position";
import {
  makeStubLessonRepository,
  makeStubPlaybackPositionRepository,
} from "@/test-setup/stubs/domain-repos";

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

describe("recordPlaybackPosition", () => {
  describe("GIVEN a lesson that exists", () => {
    test("WHEN the use case runs THEN it resolves with { recorded: true }", async () => {
      const lesson = fixtureLesson();
      const positions = makeStubPlaybackPositionRepository();
      const useCase = makeRecordPlaybackPosition({
        lessons: makeStubLessonRepository({ lessons: [lesson] }),
        positions,
      });

      const result = await useCase({ lessonId: lesson.id, seconds: 42 });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual({ recorded: true });
      }
    });

    test("WHEN the use case runs THEN the position repository is written to", async () => {
      const lesson = fixtureLesson();
      const positions = makeStubPlaybackPositionRepository();
      const setSpy = vi.spyOn(positions, "setPosition");
      const useCase = makeRecordPlaybackPosition({
        lessons: makeStubLessonRepository({ lessons: [lesson] }),
        positions,
      });

      await useCase({ lessonId: lesson.id, seconds: 123 });

      expect(setSpy).toHaveBeenCalledWith(lesson.id, 123);
    });

    test("WHEN the use case runs THEN the position repository observably holds the value after resolution", async () => {
      const lesson = fixtureLesson();
      const positions = makeStubPlaybackPositionRepository();
      const useCase = makeRecordPlaybackPosition({
        lessons: makeStubLessonRepository({ lessons: [lesson] }),
        positions,
      });

      const result = await useCase({ lessonId: lesson.id, seconds: 77 });

      expect(result.isOk()).toBe(true);
      expect(await positions.getPosition(lesson.id)).toBe(77);
    });
  });

  describe("GIVEN a lessonId that does not exist", () => {
    test("WHEN the use case runs THEN it resolves with lesson-not-found and never writes", async () => {
      const missing = LessonIdSchema.parse(faker.string.uuid());
      const positions = makeStubPlaybackPositionRepository();
      const setSpy = vi.spyOn(positions, "setPosition");
      const useCase = makeRecordPlaybackPosition({
        lessons: makeStubLessonRepository({ lessons: [] }),
        positions,
      });

      const result = await useCase({ lessonId: missing, seconds: 10 });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toEqual({ kind: "lesson-not-found" });
      }
      expect(setSpy).not.toHaveBeenCalled();
    });
  });

  describe("GIVEN a position repository whose setPosition rejects", () => {
    test("WHEN the use case runs THEN it resolves with internal-error", async () => {
      const lesson = fixtureLesson();
      const positions = makeStubPlaybackPositionRepository({ setPositionRejects: true });
      const useCase = makeRecordPlaybackPosition({
        lessons: makeStubLessonRepository({ lessons: [lesson] }),
        positions,
      });

      const result = await useCase({ lessonId: lesson.id, seconds: 5 });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.kind).toBe("internal-error");
      }
    });
  });

  describe("GIVEN a lessonRepository whose byId rejects", () => {
    test("WHEN the use case runs THEN it resolves with internal-error and never writes", async () => {
      const lesson = fixtureLesson();
      const positions = makeStubPlaybackPositionRepository();
      const setSpy = vi.spyOn(positions, "setPosition");
      const useCase = makeRecordPlaybackPosition({
        lessons: {
          byId: async () => {
            throw new Error("lesson-repo exploded");
          },
          listByCourse: async () => [],
        },
        positions,
      });

      const result = await useCase({ lessonId: lesson.id, seconds: 5 });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.kind).toBe("internal-error");
      }
      expect(setSpy).not.toHaveBeenCalled();
    });
  });
});
