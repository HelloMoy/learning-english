import { LessonId } from "@/domain/entities/ids/ids";

import { faker } from "@faker-js/faker";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  refreshSavedPlaybackPositions,
  savedPlaybackPositionsServerSnapshot,
  useSavedPlaybackPositions,
} from "./use-saved-playback-positions";

const STORAGE_KEY_PREFIX = "learning-english:playback:";

const storeSeconds = (lessonId: LessonId, seconds: number): void => {
  window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${lessonId}`, seconds.toString());
};

beforeEach(() => {
  window.localStorage.clear();
  // The store caches its snapshot; clearing storage behind its back would
  // leave it stale, so tell it to re-read.
  act(() => {
    refreshSavedPlaybackPositions();
  });
});

describe("useSavedPlaybackPositions", () => {
  test("WHEN nothing has been watched THEN the snapshot is empty", () => {
    const { result } = renderHook(() => useSavedPlaybackPositions());

    expect(result.current.size).toBe(0);
  });

  test("WHEN storage holds positions THEN the snapshot maps every lesson to its seconds", () => {
    const first = LessonId.parse(faker.string.uuid());
    const second = LessonId.parse(faker.string.uuid());
    storeSeconds(first, 240);
    storeSeconds(second, 12.5);
    act(() => {
      refreshSavedPlaybackPositions();
    });

    const { result } = renderHook(() => useSavedPlaybackPositions());

    expect(result.current.get(first)).toBe(240);
    expect(result.current.get(second)).toBe(12.5);
  });

  test("WHEN the origin holds keys from other features THEN they are ignored", () => {
    const lessonId = LessonId.parse(faker.string.uuid());
    window.localStorage.setItem(`learning-english:completed:${lessonId}`, "1");
    window.localStorage.setItem("some-other-app:playback:whatever", "99");
    act(() => {
      refreshSavedPlaybackPositions();
    });

    const { result } = renderHook(() => useSavedPlaybackPositions());

    expect(result.current.size).toBe(0);
  });

  test("WHEN a stored value is not a number THEN that entry is dropped rather than read as NaN", () => {
    const lessonId = LessonId.parse(faker.string.uuid());
    window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${lessonId}`, "not-a-number");
    act(() => {
      refreshSavedPlaybackPositions();
    });

    const { result } = renderHook(() => useSavedPlaybackPositions());

    expect(result.current.has(lessonId)).toBe(false);
  });

  test("WHEN read twice with no write in between THEN the same reference comes back", () => {
    // useSyncExternalStore compares snapshots by identity; a fresh Map per
    // read would re-render forever.
    const { result, rerender } = renderHook(() => useSavedPlaybackPositions());
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });

  test("WHEN a position is written in this tab THEN every subscriber sees it", () => {
    const lessonId = LessonId.parse(faker.string.uuid());
    const first = renderHook(() => useSavedPlaybackPositions());
    const second = renderHook(() => useSavedPlaybackPositions());

    act(() => {
      storeSeconds(lessonId, 300);
      refreshSavedPlaybackPositions();
    });

    // Two surfaces reading the same store must agree — this is what the
    // shared snapshot buys over per-component state.
    expect(first.result.current.get(lessonId)).toBe(300);
    expect(second.result.current.get(lessonId)).toBe(300);
  });

  test("WHEN another tab writes a position THEN subscribers pick it up", () => {
    const lessonId = LessonId.parse(faker.string.uuid());
    const { result } = renderHook(() => useSavedPlaybackPositions());

    act(() => {
      storeSeconds(lessonId, 42);
      window.dispatchEvent(
        new StorageEvent("storage", { key: `${STORAGE_KEY_PREFIX}${lessonId}` }),
      );
    });

    expect(result.current.get(lessonId)).toBe(42);
  });

  describe("GIVEN storage the browser refuses to read", () => {
    const realGetItem = Storage.prototype.getItem;
    const realKey = Storage.prototype.key;

    afterEach(() => {
      Storage.prototype.getItem = realGetItem;
      Storage.prototype.key = realKey;
    });

    test("WHEN reading throws THEN the snapshot is empty and nothing escapes", () => {
      Storage.prototype.key = vi.fn(() => {
        throw new DOMException("blocked", "SecurityError");
      });

      expect(() =>
        act(() => {
          refreshSavedPlaybackPositions();
        }),
      ).not.toThrow();

      const { result } = renderHook(() => useSavedPlaybackPositions());

      expect(result.current.size).toBe(0);
    });
  });
});

describe("savedPlaybackPositionsServerSnapshot", () => {
  test("WHEN rendering on the server THEN the snapshot is empty", () => {
    // The server cannot read localStorage, so it must render no progress —
    // and the first client render must agree, or React warns about a
    // hydration mismatch on every page carrying an indicator.
    expect(savedPlaybackPositionsServerSnapshot().size).toBe(0);
  });

  test("WHEN called repeatedly THEN it returns the same reference", () => {
    expect(savedPlaybackPositionsServerSnapshot()).toBe(savedPlaybackPositionsServerSnapshot());
  });
});
