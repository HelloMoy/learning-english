import { LessonId } from "@/domain/entities/ids/ids";
import { refreshSavedPlaybackPositions } from "@/hooks/use-saved-playback-positions/use-saved-playback-positions";
import { finishThresholdSeconds } from "@/lib/watch-progress/watch-progress";

import { faker } from "@faker-js/faker";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";

import { useLessonWatchState } from "./use-lesson-watch-state";

const LESSON_DURATION_SECONDS = 600;

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

describe("useLessonWatchState", () => {
  describe("GIVEN a lesson the learner has never opened", () => {
    test("WHEN the state is read THEN nothing is watched and it is not complete", () => {
      const lessonId = LessonId.parse(faker.string.uuid());

      const { result } = renderHook(() =>
        useLessonWatchState({ lessonId, durationSeconds: LESSON_DURATION_SECONDS }),
      );

      expect(result.current).toEqual({ watchedFraction: 0, isComplete: false });
    });
  });

  describe("GIVEN a lesson marked through the button", () => {
    test("WHEN it was never played THEN it is complete with a full bar", () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      markCompleteInStorage(lessonId);
      announceStorageChange();

      const { result } = renderHook(() =>
        useLessonWatchState({ lessonId, durationSeconds: LESSON_DURATION_SECONDS }),
      );

      // A completed lesson reads as fully watched, so "finished" and
      // "nearly finished" are never drawn the same way.
      expect(result.current).toEqual({ watchedFraction: 1, isComplete: true });
    });
  });

  describe("GIVEN a lesson watched to its end but never marked", () => {
    test("WHEN the state is read THEN it is complete, with no write needed to make it so", () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      storePosition(lessonId, finishThresholdSeconds(LESSON_DURATION_SECONDS));
      announceStorageChange();

      const { result } = renderHook(() =>
        useLessonWatchState({ lessonId, durationSeconds: LESSON_DURATION_SECONDS }),
      );

      expect(result.current).toEqual({ watchedFraction: 1, isComplete: true });
      expect(window.localStorage.getItem(`learning-english:completed:${lessonId}`)).toBeNull();
    });
  });

  describe("GIVEN a lesson watched partway", () => {
    test("WHEN the state is read THEN the real fraction is reported and it is not complete", () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      storePosition(lessonId, 240);
      announceStorageChange();

      const { result } = renderHook(() =>
        useLessonWatchState({ lessonId, durationSeconds: LESSON_DURATION_SECONDS }),
      );

      expect(result.current.watchedFraction).toBeCloseTo(0.4);
      expect(result.current.isComplete).toBe(false);
    });
  });

  describe("GIVEN a lesson with no runtime", () => {
    test("WHEN a position somehow exists THEN completion falls back to the mark alone", () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      storePosition(lessonId, 240);
      announceStorageChange();

      const { result } = renderHook(() => useLessonWatchState({ lessonId, durationSeconds: 0 }));

      expect(result.current).toEqual({ watchedFraction: 0, isComplete: false });
    });

    test("WHEN it was marked through the button THEN it is complete", () => {
      const lessonId = LessonId.parse(faker.string.uuid());
      markCompleteInStorage(lessonId);
      announceStorageChange();

      const { result } = renderHook(() => useLessonWatchState({ lessonId, durationSeconds: 0 }));

      expect(result.current.isComplete).toBe(true);
    });
  });

  describe("GIVEN two lessons", () => {
    test("WHEN one is watched THEN the other is unaffected", () => {
      const watched = LessonId.parse(faker.string.uuid());
      const other = LessonId.parse(faker.string.uuid());
      storePosition(watched, 240);
      announceStorageChange();

      const { result } = renderHook(() =>
        useLessonWatchState({ lessonId: other, durationSeconds: LESSON_DURATION_SECONDS }),
      );

      expect(result.current).toEqual({ watchedFraction: 0, isComplete: false });
    });
  });
});
