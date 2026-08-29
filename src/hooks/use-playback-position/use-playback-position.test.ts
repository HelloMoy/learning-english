import { LessonId } from "@/domain/entities/ids/ids";
import type { PlaybackPositionRepository } from "@/domain/ports/playback-position-repository/playback-position-repository";

import { faker } from "@faker-js/faker";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";

import { usePlaybackPosition } from "./use-playback-position";

const mockStorage = new Map<string, string>();

beforeEach(() => {
  mockStorage.clear();
  // jsdom provides window.localStorage, but we replace getItem/setItem with
  // a plain Map to isolate each test.
  const stub = {
    getItem: (key: string) => mockStorage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      mockStorage.set(key, value);
    },
    removeItem: (key: string) => {
      mockStorage.delete(key);
    },
    clear: () => mockStorage.clear(),
    key: () => null,
    length: 0,
  };
  // Inject stub onto the jsdom window directly so the adapter sees it.
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    writable: true,
    value: stub,
  });
});

describe("usePlaybackPosition", () => {
  test("WHEN get() is called on a fresh lessonId THEN it returns null", async () => {
    const lessonId = LessonId.parse(faker.string.uuid());
    const { result } = renderHook(() => usePlaybackPosition(lessonId));

    let value: number | null | undefined;
    await act(async () => {
      value = await result.current.get();
    });

    expect(value).toBeNull();
  });

  test("WHEN set(42) is called THEN a subsequent get() returns 42", async () => {
    const lessonId = LessonId.parse(faker.string.uuid());
    const { result } = renderHook(() => usePlaybackPosition(lessonId));

    await act(async () => {
      await result.current.set(42);
    });

    let value: number | null | undefined;
    await act(async () => {
      value = await result.current.get();
    });
    expect(value).toBe(42);
  });

  test("WHEN a position is stored before mount and get() is called THEN it returns the seeded value", async () => {
    const lessonId = LessonId.parse(faker.string.uuid());
    mockStorage.set(`learning-english:playback:${lessonId}`, "180");

    const { result } = renderHook(() => usePlaybackPosition(lessonId));

    let value: number | null | undefined;
    await act(async () => {
      value = await result.current.get();
    });

    expect(value).toBe(180);
  });

  describe("GIVEN an injected repository", () => {
    test("WHEN the hook runs THEN it uses that port instead of localStorage", async () => {
      // Arrange — the injection seam exists so a test never has to reach for
      // window.localStorage to control the hook.
      const lessonId = LessonId.parse(faker.string.uuid());
      const positions = new Map<string, number>([[lessonId, 321]]);
      const fake: PlaybackPositionRepository = {
        getPosition: async (id) => positions.get(id) ?? null,
        setPosition: async (id, seconds) => {
          positions.set(id, seconds);
        },
      };
      const { result } = renderHook(() => usePlaybackPosition(lessonId, fake));

      // Act
      let value: number | null | undefined;
      await act(async () => {
        value = await result.current.get();
      });

      // Assert
      expect(value).toBe(321);
      expect(mockStorage.size).toBe(0);
    });
  });

  describe("GIVEN a value the PlaybackPosition value object rejects", () => {
    test.each([
      ["NaN", Number.NaN],
      ["Infinity", Number.POSITIVE_INFINITY],
      ["a negative", -1],
    ])("WHEN set(%s) is called THEN it reports failure and writes nothing", async (_label, bad) => {
      // Arrange — a detached <video> reports NaN for currentTime, so this is
      // the realistic path, not a hypothetical.
      const lessonId = LessonId.parse(faker.string.uuid());
      const { result } = renderHook(() => usePlaybackPosition(lessonId));

      // Act
      let persisted: boolean | undefined;
      await act(async () => {
        persisted = await result.current.set(bad);
      });

      // Assert
      expect(persisted).toBe(false);
      expect(mockStorage.size).toBe(0);
    });

    test("WHEN a valid value follows a rejected one THEN it still persists", async () => {
      // Arrange
      const lessonId = LessonId.parse(faker.string.uuid());
      const { result } = renderHook(() => usePlaybackPosition(lessonId));

      // Act
      await act(async () => {
        await result.current.set(Number.NaN);
        await result.current.set(55);
      });

      // Assert — a rejected write must not leave the hook wedged.
      let value: number | null | undefined;
      await act(async () => {
        value = await result.current.get();
      });
      expect(value).toBe(55);
    });
  });

  test("WHEN a position is set, the hook remounts, and get() is called THEN it returns the persisted value", async () => {
    const lessonId = LessonId.parse(faker.string.uuid());
    const first = renderHook(() => usePlaybackPosition(lessonId));
    await act(async () => {
      await first.result.current.set(99);
    });
    first.unmount();

    const second = renderHook(() => usePlaybackPosition(lessonId));
    let value: number | null | undefined;
    await act(async () => {
      value = await second.result.current.get();
    });

    expect(value).toBe(99);
  });
});
