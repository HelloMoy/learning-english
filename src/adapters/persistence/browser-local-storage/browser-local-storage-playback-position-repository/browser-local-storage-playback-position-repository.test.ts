import { LessonId } from "@/domain/entities/ids/ids";

import { faker } from "@faker-js/faker";
import { afterEach, describe, expect, test } from "vitest";

import { BrowserLocalStoragePlaybackPositionRepository } from "./browser-local-storage-playback-position-repository";

const STORAGE_KEY_PREFIX = "learning-english:playback:";

const clearStorage = () => window.localStorage.clear();

describe("BrowserLocalStoragePlaybackPositionRepository", () => {
  afterEach(() => {
    clearStorage();
  });

  describe("GIVEN a freshly cleared storage", () => {
    test("WHEN getPosition is called for an unsaved lesson THEN it returns null", async () => {
      const repo = new BrowserLocalStoragePlaybackPositionRepository();

      const result = await repo.getPosition(LessonId.parse(faker.string.uuid()));

      expect(result).toBeNull();
    });
  });

  describe("GIVEN a position was set", () => {
    test("WHEN getPosition is called THEN it returns the saved seconds", async () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      const repo = new BrowserLocalStoragePlaybackPositionRepository();

      await repo.setPosition(lessonId, 123);
      const result = await repo.getPosition(lessonId);

      expect(result).toBe(123);
    });

    test("WHEN the storage key is namespaced with the lessonId THEN the key is namespaced under learning-english:playback:", async () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      const repo = new BrowserLocalStoragePlaybackPositionRepository();

      await repo.setPosition(lessonId, 5);

      expect(window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${lessonId}`)).toBe("5");
    });
  });

  describe("GIVEN a position for lessonA was set", () => {
    test("WHEN getPosition is called for lessonB THEN it returns null", async () => {
      const lessonA = LessonId.parse(faker.string.uuid());
      const lessonB = LessonId.parse(faker.string.uuid());
      const repo = new BrowserLocalStoragePlaybackPositionRepository();

      await repo.setPosition(lessonA, 60);
      const result = await repo.getPosition(lessonB);

      expect(result).toBeNull();
    });
  });

  describe("GIVEN setPosition is called twice with the same lessonId", () => {
    test("WHEN getPosition is called THEN it returns the most recent seconds (idempotent overwrite)", async () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      const repo = new BrowserLocalStoragePlaybackPositionRepository();

      await repo.setPosition(lessonId, 10);
      await repo.setPosition(lessonId, 200);
      const result = await repo.getPosition(lessonId);

      expect(result).toBe(200);
    });
  });

  describe("GIVEN setPosition is called with seconds = 0", () => {
    test("WHEN getPosition is called THEN it returns 0 (zero is a valid persisted value)", async () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      const repo = new BrowserLocalStoragePlaybackPositionRepository();

      await repo.setPosition(lessonId, 0);
      const result = await repo.getPosition(lessonId);

      expect(result).toBe(0);
    });
  });

  describe("GIVEN the underlying storage is missing the key (e.g. setPosition was never called)", () => {
    test("WHEN getPosition is called THEN it returns null without throwing", async () => {
      window.localStorage.clear();
      const repo = new BrowserLocalStoragePlaybackPositionRepository();
      const lessonId = LessonId.parse(faker.string.uuid());

      const result = await repo.getPosition(lessonId);

      expect(result).toBeNull();
    });
  });

  describe("GIVEN an instance constructed when window.localStorage is missing", () => {
    test("WHEN getPosition is called THEN it returns null (defensive no-op)", async () => {
      const repo = new BrowserLocalStoragePlaybackPositionRepository({ localStorage: undefined });
      const lessonId = LessonId.parse(faker.string.uuid());

      const result = await repo.getPosition(lessonId);

      expect(result).toBeNull();
    });

    test("WHEN setPosition is called THEN it resolves without throwing (defensive no-op)", async () => {
      const repo = new BrowserLocalStoragePlaybackPositionRepository({ localStorage: undefined });
      const lessonId = LessonId.parse(faker.string.uuid());

      await expect(repo.setPosition(lessonId, 99)).resolves.toBeUndefined();
    });
  });
});
