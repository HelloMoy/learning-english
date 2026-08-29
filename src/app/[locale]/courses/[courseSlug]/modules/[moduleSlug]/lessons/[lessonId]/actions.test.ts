import { LessonId } from "@/domain/entities/ids/ids";

import { faker } from "@faker-js/faker";
import { beforeEach, describe, expect, test, vi } from "vitest";

/**
 * These actions run through `next-safe-action`, so a result carries either
 * `data` (the body ran) or `validationErrors` (the schema rejected the input
 * and the body never ran). Asserting on both halves is the point: the older
 * hand-rolled `safeParse` collapsed "the use case said no" and "your input
 * was malformed" into the same `false`, which a caller could not tell apart.
 */
const mockMarkComplete = vi.fn();
const mockRecordPosition = vi.fn();

vi.mock("@/adapters/persistence/in-memory/use-case-dependencies/use-case-dependencies", () => ({
  getCoursePlatformDeps: () => ({
    useCases: {
      markLessonComplete: mockMarkComplete,
      recordPlaybackPosition: mockRecordPosition,
    },
  }),
}));

const okResult = <T>(value: T) => ({ isOk: () => true, isErr: () => false, value });
const errResult = <E>(error: E) => ({ isOk: () => false, isErr: () => true, error });

describe("markLessonCompleteAction", () => {
  beforeEach(() => {
    mockMarkComplete.mockReset();
  });

  describe("GIVEN a valid lessonId", () => {
    test("WHEN the use case returns ok THEN the action reports completed", async () => {
      // Arrange
      const lessonId = LessonId.parse(faker.string.uuid());
      mockMarkComplete.mockResolvedValue(okResult({ completed: true }));
      const { markLessonCompleteAction } = await import("./actions");

      // Act
      const result = await markLessonCompleteAction({ lessonId });

      // Assert
      expect(result?.data).toEqual({ completed: true });
      expect(mockMarkComplete).toHaveBeenCalledWith({ lessonId });
    });

    test("WHEN the use case returns err THEN the action reports not completed", async () => {
      // Arrange
      const lessonId = LessonId.parse(faker.string.uuid());
      mockMarkComplete.mockResolvedValue(errResult({ kind: "lesson-not-found" }));
      const { markLessonCompleteAction } = await import("./actions");

      // Act
      const result = await markLessonCompleteAction({ lessonId });

      // Assert — the body ran and decided; this is not a validation failure.
      expect(result?.data).toEqual({ completed: false });
      expect(result?.validationErrors).toBeUndefined();
    });
  });

  describe("GIVEN an invalid lessonId (not a UUID)", () => {
    test("WHEN the action runs THEN validation rejects it without calling the use case", async () => {
      // Arrange
      const { markLessonCompleteAction } = await import("./actions");

      // Act
      const result = await markLessonCompleteAction({ lessonId: "not-a-uuid" as never });

      // Assert
      expect(result?.data).toBeUndefined();
      expect(result?.validationErrors).toBeDefined();
      expect(mockMarkComplete).not.toHaveBeenCalled();
    });
  });
});

describe("recordPlaybackPositionAction", () => {
  beforeEach(() => {
    mockRecordPosition.mockReset();
  });

  describe("GIVEN a valid lessonId and seconds", () => {
    test("WHEN the use case returns ok THEN the action reports recorded", async () => {
      // Arrange
      const lessonId = LessonId.parse(faker.string.uuid());
      mockRecordPosition.mockResolvedValue(okResult({ recorded: true }));
      const { recordPlaybackPositionAction } = await import("./actions");

      // Act
      const result = await recordPlaybackPositionAction({ lessonId, seconds: 42 });

      // Assert
      expect(result?.data).toEqual({ recorded: true });
      expect(mockRecordPosition).toHaveBeenCalledWith({ lessonId, seconds: 42 });
    });

    test("WHEN the use case returns err THEN the action reports not recorded", async () => {
      // Arrange
      const lessonId = LessonId.parse(faker.string.uuid());
      mockRecordPosition.mockResolvedValue(errResult({ kind: "internal-error", cause: "boom" }));
      const { recordPlaybackPositionAction } = await import("./actions");

      // Act
      const result = await recordPlaybackPositionAction({ lessonId, seconds: 42 });

      // Assert
      expect(result?.data).toEqual({ recorded: false });
      expect(result?.validationErrors).toBeUndefined();
    });

    test("WHEN seconds = 0 THEN the action persists it (zero is valid)", async () => {
      // Arrange — zero is a legitimate position, not a missing value.
      const lessonId = LessonId.parse(faker.string.uuid());
      mockRecordPosition.mockResolvedValue(okResult({ recorded: true }));
      const { recordPlaybackPositionAction } = await import("./actions");

      // Act
      const result = await recordPlaybackPositionAction({ lessonId, seconds: 0 });

      // Assert
      expect(result?.data).toEqual({ recorded: true });
      expect(mockRecordPosition).toHaveBeenCalledWith({ lessonId, seconds: 0 });
    });
  });

  describe("GIVEN invalid input", () => {
    test("WHEN lessonId is not a UUID THEN validation rejects it before the use case", async () => {
      // Arrange
      const { recordPlaybackPositionAction } = await import("./actions");

      // Act
      const result = await recordPlaybackPositionAction({ lessonId: "nope" as never, seconds: 5 });

      // Assert
      expect(result?.validationErrors).toBeDefined();
      expect(mockRecordPosition).not.toHaveBeenCalled();
    });

    test("WHEN seconds is negative THEN validation rejects it before the use case", async () => {
      // Arrange
      const lessonId = LessonId.parse(faker.string.uuid());
      const { recordPlaybackPositionAction } = await import("./actions");

      // Act
      const result = await recordPlaybackPositionAction({ lessonId, seconds: -1 });

      // Assert
      expect(result?.validationErrors).toBeDefined();
      expect(mockRecordPosition).not.toHaveBeenCalled();
    });

    test("WHEN seconds is NaN THEN validation rejects it before the use case", async () => {
      // Arrange — a detached media element can report NaN for currentTime.
      const lessonId = LessonId.parse(faker.string.uuid());
      const { recordPlaybackPositionAction } = await import("./actions");

      // Act
      const result = await recordPlaybackPositionAction({ lessonId, seconds: Number.NaN });

      // Assert
      expect(result?.validationErrors).toBeDefined();
      expect(mockRecordPosition).not.toHaveBeenCalled();
    });

    test("WHEN seconds is Infinity THEN validation rejects it before the use case", async () => {
      // Arrange
      const lessonId = LessonId.parse(faker.string.uuid());
      const { recordPlaybackPositionAction } = await import("./actions");

      // Act
      const result = await recordPlaybackPositionAction({
        lessonId,
        seconds: Number.POSITIVE_INFINITY,
      });

      // Assert
      expect(result?.validationErrors).toBeDefined();
      expect(mockRecordPosition).not.toHaveBeenCalled();
    });
  });
});
