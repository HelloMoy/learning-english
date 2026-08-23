import { LessonId } from "@/domain/entities/ids/ids";

import { faker } from "@faker-js/faker";
import { describe, expect, test } from "vitest";

import { InMemoryPlaybackPositionRepository } from "./in-memory-playback-position-repository";

describe("InMemoryPlaybackPositionRepository", () => {
  describe("GIVEN a fresh repository", () => {
    test("WHEN getPosition is called for an unknown lesson THEN it returns null", async () => {
      const repo = new InMemoryPlaybackPositionRepository();

      const result = await repo.getPosition(LessonId.parse(faker.string.uuid()));

      expect(result).toBeNull();
    });
  });

  describe("GIVEN a position has been set for a lesson", () => {
    test("WHEN getPosition is called for that lesson THEN it returns the saved seconds", async () => {
      const repo = new InMemoryPlaybackPositionRepository();
      const lessonId = LessonId.parse(faker.string.uuid());

      await repo.setPosition(lessonId, 90);
      const result = await repo.getPosition(lessonId);

      expect(result).toBe(90);
    });

    test("WHEN setPosition is called twice with the same lessonId THEN the latest value is observable", async () => {
      const repo = new InMemoryPlaybackPositionRepository();
      const lessonId = LessonId.parse(faker.string.uuid());

      await repo.setPosition(lessonId, 30);
      await repo.setPosition(lessonId, 60);

      expect(await repo.getPosition(lessonId)).toBe(60);
    });
  });

  describe("GIVEN a position was set for lessonA", () => {
    test("WHEN getPosition is called for lessonB THEN it returns null", async () => {
      const repo = new InMemoryPlaybackPositionRepository();
      const lessonA = LessonId.parse(faker.string.uuid());
      const lessonB = LessonId.parse(faker.string.uuid());

      await repo.setPosition(lessonA, 5);

      expect(await repo.getPosition(lessonB)).toBeNull();
    });
  });

  describe("GIVEN a repository initialized with seed positions", () => {
    test("WHEN getPosition is called THEN it returns the seeded value", async () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      const repo = new InMemoryPlaybackPositionRepository({ initial: { [lessonId]: 42 } });

      const result = await repo.getPosition(lessonId);

      expect(result).toBe(42);
    });
  });
});
