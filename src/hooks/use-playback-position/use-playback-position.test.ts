import { LessonId } from "@/domain/entities/ids/ids";

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
