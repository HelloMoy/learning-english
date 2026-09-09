import { LessonId } from "@/domain/entities/ids/ids";
import { refreshSavedPlaybackPositions } from "@/hooks/use-saved-playback-positions/use-saved-playback-positions";
import { finishThresholdSeconds } from "@/lib/watch-progress/watch-progress";

import { faker } from "@faker-js/faker";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";

import { useModuleWatchProgress } from "./use-module-watch-progress";

const LESSON_DURATION_SECONDS = 600;

const makeRuntimes = (count: number): { id: LessonId; durationSeconds: number }[] =>
  Array.from({ length: count }, () => ({
    id: LessonId.parse(faker.string.uuid()),
    durationSeconds: LESSON_DURATION_SECONDS,
  }));

const markCompleteInStorage = (lessonId: LessonId): void => {
  window.localStorage.setItem(`learning-english:completed:${lessonId}`, "1");
};

const storePosition = (lessonId: LessonId, seconds: number): void => {
  window.localStorage.setItem(`learning-english:playback:${lessonId}`, seconds.toString());
};

/** Both stores cache their snapshot, so seeded storage has to be announced. */
const announceStorageChange = (): void => {
  act(() => {
    refreshSavedPlaybackPositions();
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
  });
};

beforeEach(() => {
  window.localStorage.clear();
  announceStorageChange();
});

describe("useModuleWatchProgress", () => {
  describe("GIVEN a module the learner has never opened", () => {
    test("WHEN the progress is read THEN nothing is counted complete", () => {
      const runtimes = makeRuntimes(17);

      const { result } = renderHook(() => useModuleWatchProgress(runtimes));

      expect(result.current).toEqual({ completedCount: 0, lessonCount: 17 });
    });
  });

  describe("GIVEN lessons completed by both routes", () => {
    test("WHEN one was marked and another watched to the end THEN both are counted", () => {
      const runtimes = makeRuntimes(17);
      markCompleteInStorage(runtimes[0]!.id);
      storePosition(runtimes[1]!.id, finishThresholdSeconds(LESSON_DURATION_SECONDS));
      announceStorageChange();

      const { result } = renderHook(() => useModuleWatchProgress(runtimes));

      expect(result.current).toEqual({ completedCount: 2, lessonCount: 17 });
    });

    test("WHEN a lesson was only partly watched THEN it is not counted", () => {
      const runtimes = makeRuntimes(17);
      storePosition(runtimes[0]!.id, 240);
      announceStorageChange();

      const { result } = renderHook(() => useModuleWatchProgress(runtimes));

      expect(result.current.completedCount).toBe(0);
    });
  });

  describe("GIVEN a module larger than the course overview's lesson preview", () => {
    test("WHEN a lesson beyond the preview is complete THEN it still counts", () => {
      // The card previews six lessons; the meter must count all 17.
      const runtimes = makeRuntimes(17);
      markCompleteInStorage(runtimes[16]!.id);
      announceStorageChange();

      const { result } = renderHook(() => useModuleWatchProgress(runtimes));

      expect(result.current).toEqual({ completedCount: 1, lessonCount: 17 });
    });
  });

  describe("GIVEN a module holding no lessons", () => {
    test("WHEN the progress is read THEN both counts are zero and nothing is divided", () => {
      const { result } = renderHook(() => useModuleWatchProgress([]));

      expect(result.current).toEqual({ completedCount: 0, lessonCount: 0 });
    });
  });

  describe("GIVEN a module holding a lesson with no runtime", () => {
    test("WHEN that lesson was marked THEN it counts, and an unmarked one does not", () => {
      const reading = { id: LessonId.parse(faker.string.uuid()), durationSeconds: 0 };
      const other = { id: LessonId.parse(faker.string.uuid()), durationSeconds: 0 };
      markCompleteInStorage(reading.id);
      announceStorageChange();

      const { result } = renderHook(() => useModuleWatchProgress([reading, other]));

      expect(result.current).toEqual({ completedCount: 1, lessonCount: 2 });
    });
  });
});
