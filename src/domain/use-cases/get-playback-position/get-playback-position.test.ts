import { LessonId as LessonIdSchema } from "@/domain/entities/ids/ids";
import { makeGetPlaybackPosition } from "@/domain/use-cases/get-playback-position/get-playback-position";
import { makeStubPlaybackPositionRepository } from "@/test-setup/stubs/domain-repos";

import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

describe("getPlaybackPosition", () => {
  describe("GIVEN a lesson that has a saved position", () => {
    test("WHEN the use case runs THEN it resolves with { seconds: <value> }", async () => {
      const lessonId = LessonIdSchema.parse(faker.string.uuid());
      const positions = makeStubPlaybackPositionRepository({
        positions: { [lessonId]: 42 },
      });
      const useCase = makeGetPlaybackPosition({ positions });

      const result = await useCase({ lessonId });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual({ seconds: 42 });
      }
    });

    test("WHEN the use case runs with seconds = 0 THEN it resolves with { seconds: 0 }", async () => {
      const lessonId = LessonIdSchema.parse(faker.string.uuid());
      const positions = makeStubPlaybackPositionRepository({
        positions: { [lessonId]: 0 },
      });
      const useCase = makeGetPlaybackPosition({ positions });

      const result = await useCase({ lessonId });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual({ seconds: 0 });
      }
    });
  });

  describe("GIVEN a lesson that has no saved position", () => {
    test("WHEN the use case runs THEN it resolves with { seconds: null }", async () => {
      const missing = LessonIdSchema.parse(faker.string.uuid());
      const positions = makeStubPlaybackPositionRepository();
      const useCase = makeGetPlaybackPosition({ positions });

      const result = await useCase({ lessonId: missing });

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual({ seconds: null });
      }
    });
  });

  describe("GIVEN a position repository whose getPosition rejects", () => {
    test("WHEN the use case runs THEN it resolves with internal-error", async () => {
      const lessonId = LessonIdSchema.parse(faker.string.uuid());
      const positions = makeStubPlaybackPositionRepository({ getPositionRejects: true });
      const useCase = makeGetPlaybackPosition({ positions });

      const result = await useCase({ lessonId });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.kind).toBe("internal-error");
      }
    });
  });
});
