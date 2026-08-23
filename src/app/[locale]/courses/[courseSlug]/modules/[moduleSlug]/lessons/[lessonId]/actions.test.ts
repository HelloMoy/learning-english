import { LessonId } from "@/domain/entities/ids/ids";

import { faker } from "@faker-js/faker";
import { beforeEach, describe, expect, test, vi } from "vitest";

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

describe("markLessonCompleteAction", () => {
  beforeEach(() => {
    mockMarkComplete.mockReset();
  });

  describe("GIVEN a valid lessonId", () => {
    test("WHEN the use case returns ok THEN the action returns { completed: true }", async () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      mockMarkComplete.mockResolvedValue({
        isOk: () => true,
        isErr: () => false,
        value: { completed: true },
      });
      const { markLessonCompleteAction } = await import("./actions");

      const result = await markLessonCompleteAction({ lessonId });

      expect(result).toEqual({ completed: true });
      expect(mockMarkComplete).toHaveBeenCalledWith({ lessonId });
    });

    test("WHEN the use case returns err THEN the action returns { completed: false }", async () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      mockMarkComplete.mockResolvedValue({
        isOk: () => false,
        isErr: () => true,
        error: { kind: "lesson-not-found" },
      });
      const { markLessonCompleteAction } = await import("./actions");

      const result = await markLessonCompleteAction({ lessonId });

      expect(result).toEqual({ completed: false });
    });
  });

  describe("GIVEN an invalid lessonId (not a UUID)", () => {
    test("WHEN the action runs THEN it returns { completed: false } without calling the use case", async () => {
      const { markLessonCompleteAction } = await import("./actions");

      const result = await markLessonCompleteAction({ lessonId: "not-a-uuid" as never });

      expect(result).toEqual({ completed: false });
      expect(mockMarkComplete).not.toHaveBeenCalled();
    });
  });
});

describe("recordPlaybackPositionAction", () => {
  beforeEach(() => {
    mockRecordPosition.mockReset();
  });

  describe("GIVEN a valid lessonId and seconds", () => {
    test("WHEN the use case returns ok THEN the action returns { recorded: true }", async () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      mockRecordPosition.mockResolvedValue({
        isOk: () => true,
        isErr: () => false,
        value: { recorded: true },
      });
      const { recordPlaybackPositionAction } = await import("./actions");

      const result = await recordPlaybackPositionAction({ lessonId, seconds: 42 });

      expect(result).toEqual({ recorded: true });
      expect(mockRecordPosition).toHaveBeenCalledWith({ lessonId, seconds: 42 });
    });

    test("WHEN the use case returns err THEN the action returns { recorded: false }", async () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      mockRecordPosition.mockResolvedValue({
        isOk: () => false,
        isErr: () => true,
        error: { kind: "internal-error", cause: "boom" },
      });
      const { recordPlaybackPositionAction } = await import("./actions");

      const result = await recordPlaybackPositionAction({ lessonId, seconds: 42 });

      expect(result).toEqual({ recorded: false });
    });

    test("WHEN seconds = 0 THEN the action persists it (zero is valid)", async () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      mockRecordPosition.mockResolvedValue({
        isOk: () => true,
        isErr: () => false,
        value: { recorded: true },
      });
      const { recordPlaybackPositionAction } = await import("./actions");

      const result = await recordPlaybackPositionAction({ lessonId, seconds: 0 });

      expect(result).toEqual({ recorded: true });
      expect(mockRecordPosition).toHaveBeenCalledWith({ lessonId, seconds: 0 });
    });
  });

  describe("GIVEN invalid input", () => {
    test("WHEN lessonId is not a UUID THEN it returns { recorded: false } without calling the use case", async () => {
      const { recordPlaybackPositionAction } = await import("./actions");

      const result = await recordPlaybackPositionAction({ lessonId: "nope" as never, seconds: 5 });

      expect(result).toEqual({ recorded: false });
      expect(mockRecordPosition).not.toHaveBeenCalled();
    });

    test("WHEN seconds is negative THEN it returns { recorded: false } without calling the use case", async () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      const { recordPlaybackPositionAction } = await import("./actions");

      const result = await recordPlaybackPositionAction({ lessonId, seconds: -1 });

      expect(result).toEqual({ recorded: false });
      expect(mockRecordPosition).not.toHaveBeenCalled();
    });

    test("WHEN seconds is NaN THEN it returns { recorded: false } without calling the use case", async () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      const { recordPlaybackPositionAction } = await import("./actions");

      const result = await recordPlaybackPositionAction({ lessonId, seconds: Number.NaN });

      expect(result).toEqual({ recorded: false });
      expect(mockRecordPosition).not.toHaveBeenCalled();
    });

    test("WHEN seconds is Infinity THEN it returns { recorded: false } without calling the use case", async () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      const { recordPlaybackPositionAction } = await import("./actions");

      const result = await recordPlaybackPositionAction({
        lessonId,
        seconds: Number.POSITIVE_INFINITY,
      });

      expect(result).toEqual({ recorded: false });
      expect(mockRecordPosition).not.toHaveBeenCalled();
    });
  });
});
