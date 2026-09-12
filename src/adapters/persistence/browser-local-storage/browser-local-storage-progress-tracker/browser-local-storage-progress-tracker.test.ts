import { LessonId } from "@/domain/entities/ids/ids";

import { faker } from "@faker-js/faker";
import { afterEach, describe, expect, test, vi } from "vitest";

import { BrowserLocalStorageProgressTracker } from "./browser-local-storage-progress-tracker";

const STORAGE_KEY_PREFIX = "learning-english:completed:";

const clearStorage = () => window.localStorage.clear();

describe("BrowserLocalStorageProgressTracker", () => {
  afterEach(() => {
    clearStorage();
  });

  describe("GIVEN a freshly cleared storage", () => {
    test("WHEN isComplete is called for an unmarked lesson THEN it resolves false", async () => {
      const tracker = new BrowserLocalStorageProgressTracker();

      const result = await tracker.isComplete(LessonId.parse(faker.string.uuid()));

      expect(result).toBe(false);
    });
  });

  describe("GIVEN a lesson was marked complete", () => {
    test("WHEN isComplete is called THEN it resolves true", async () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      const tracker = new BrowserLocalStorageProgressTracker();

      await tracker.markComplete(lessonId);
      const result = await tracker.isComplete(lessonId);

      expect(result).toBe(true);
    });

    test("WHEN the key is written THEN it is namespaced under learning-english:completed:", async () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      const tracker = new BrowserLocalStorageProgressTracker();

      await tracker.markComplete(lessonId);

      expect(window.localStorage.getItem(`${STORAGE_KEY_PREFIX}${lessonId}`)).not.toBeNull();
    });

    test("WHEN markComplete is called twice THEN it stays complete", async () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      const tracker = new BrowserLocalStorageProgressTracker();

      await tracker.markComplete(lessonId);
      await tracker.markComplete(lessonId);

      expect(await tracker.isComplete(lessonId)).toBe(true);
    });
  });

  describe("GIVEN lessonA was marked complete", () => {
    test("WHEN isComplete is called for lessonB THEN it resolves false", async () => {
      const lessonA = LessonId.parse(faker.string.uuid());
      const lessonB = LessonId.parse(faker.string.uuid());
      const tracker = new BrowserLocalStorageProgressTracker();

      await tracker.markComplete(lessonA);

      expect(await tracker.isComplete(lessonB)).toBe(false);
    });
  });

  describe("GIVEN a lesson the learner wants to take again", () => {
    test("WHEN unmarkComplete is called THEN the lesson reads as incomplete again", async () => {
      // Arrange
      const tracker = new BrowserLocalStorageProgressTracker();
      const lessonId = LessonId.parse(faker.string.uuid());
      await tracker.markComplete(lessonId);

      // Act
      await tracker.unmarkComplete(lessonId);

      // Assert
      expect(await tracker.isComplete(lessonId)).toBe(false);
    });

    test("WHEN unmarkComplete is called for a lesson that was never marked THEN it is a no-op", async () => {
      // Arrange
      const tracker = new BrowserLocalStorageProgressTracker();
      const lessonId = LessonId.parse(faker.string.uuid());

      // Act & Assert — idempotent in the way marking already is.
      await expect(tracker.unmarkComplete(lessonId)).resolves.toBeUndefined();
      expect(await tracker.isComplete(lessonId)).toBe(false);
    });

    test("WHEN one lesson is unmarked THEN the others stay complete", async () => {
      // Arrange
      const tracker = new BrowserLocalStorageProgressTracker();
      const lessonA = LessonId.parse(faker.string.uuid());
      const lessonB = LessonId.parse(faker.string.uuid());
      await tracker.markComplete(lessonA);
      await tracker.markComplete(lessonB);

      // Act
      await tracker.unmarkComplete(lessonA);

      // Assert
      expect(await tracker.isComplete(lessonB)).toBe(true);
    });
  });

  describe("GIVEN localStorage is unavailable (SSR, restricted environment)", () => {
    test("WHEN the tracker is used THEN it no-ops instead of throwing", async () => {
      // The injected seam stands in for `window.localStorage` being
      // undefined, without monkey-patching globals for the whole suite.
      const tracker = new BrowserLocalStorageProgressTracker({ localStorage: undefined });
      const lessonId = LessonId.parse(faker.string.uuid());

      await expect(tracker.markComplete(lessonId)).resolves.toBeUndefined();
      await expect(tracker.unmarkComplete(lessonId)).resolves.toBeUndefined();
      await expect(tracker.isComplete(lessonId)).resolves.toBe(false);
    });
  });

  describe("GIVEN storage rejects the write (quota exceeded, blocked)", () => {
    test("WHEN markComplete is called THEN the rejection does not reach the caller", async () => {
      // Safari private mode and a full quota both throw from setItem. The
      // playback adapter has no coverage for this, so it is written from
      // scratch rather than mirrored: a failed mark must not break the page.
      const throwing = {
        getItem: vi.fn(() => null),
        setItem: vi.fn(() => {
          throw new DOMException("QuotaExceededError");
        }),
        removeItem: vi.fn(),
        clear: vi.fn(),
        key: vi.fn(() => null),
        length: 0,
      } as unknown as Storage;
      const tracker = new BrowserLocalStorageProgressTracker({ localStorage: throwing });

      await expect(
        tracker.markComplete(LessonId.parse(faker.string.uuid())),
      ).resolves.toBeUndefined();
    });

    test("WHEN unmarkComplete is called THEN the rejection does not reach the caller", async () => {
      const throwing = {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(() => {
          throw new DOMException("SecurityError");
        }),
        clear: vi.fn(),
        key: vi.fn(() => null),
        length: 0,
      } as unknown as Storage;
      const tracker = new BrowserLocalStorageProgressTracker({ localStorage: throwing });

      await expect(
        tracker.unmarkComplete(LessonId.parse(faker.string.uuid())),
      ).resolves.toBeUndefined();
    });
  });
});
