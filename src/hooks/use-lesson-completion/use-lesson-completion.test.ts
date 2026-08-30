import { LessonId } from "@/domain/entities/ids/ids";

import { faker } from "@faker-js/faker";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";

import {
  markLessonComplete,
  serverCompletionSnapshot,
  useLessonCompletion,
} from "./use-lesson-completion";

const STORAGE_KEY_PREFIX = "learning-english:completed:";

beforeEach(() => {
  window.localStorage.clear();
  // The store caches its snapshot; clearing storage behind its back would
  // leave it stale, so tell it to re-read.
  act(() => {
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
  });
});

describe("useLessonCompletion", () => {
  test("WHEN a lesson has not been marked THEN it reports incomplete", () => {
    const lessonId = LessonId.parse(faker.string.uuid());

    const { result } = renderHook(() => useLessonCompletion(lessonId));

    expect(result.current).toBe(false);
  });

  test("WHEN storage already holds the lesson THEN it reports complete after mount", () => {
    const lessonId = LessonId.parse(faker.string.uuid());
    window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${lessonId}`, "1");
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: null }));
    });

    const { result } = renderHook(() => useLessonCompletion(lessonId));

    expect(result.current).toBe(true);
  });

  test("WHEN a lesson is marked THEN every subscriber updates without a reload", async () => {
    const lessonId = LessonId.parse(faker.string.uuid());
    const first = renderHook(() => useLessonCompletion(lessonId));
    const second = renderHook(() => useLessonCompletion(lessonId));

    await act(async () => {
      await markLessonComplete(lessonId);
    });

    // Two components reading the same lesson must agree — this is what the
    // shared store buys over per-component state.
    expect(first.result.current).toBe(true);
    expect(second.result.current).toBe(true);
  });

  test("WHEN another tab marks a lesson THEN subscribers pick it up", () => {
    const lessonId = LessonId.parse(faker.string.uuid());
    const { result } = renderHook(() => useLessonCompletion(lessonId));

    act(() => {
      window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${lessonId}`, "1");
      window.dispatchEvent(
        new StorageEvent("storage", { key: `${STORAGE_KEY_PREFIX}${lessonId}` }),
      );
    });

    expect(result.current).toBe(true);
  });

  test("WHEN one lesson is marked THEN another is unaffected", async () => {
    const marked = LessonId.parse(faker.string.uuid());
    const other = LessonId.parse(faker.string.uuid());
    const { result } = renderHook(() => useLessonCompletion(other));

    await act(async () => {
      await markLessonComplete(marked);
    });

    expect(result.current).toBe(false);
  });
});

describe("serverCompletionSnapshot", () => {
  test("WHEN rendering on the server THEN the snapshot is empty", () => {
    // The server cannot read localStorage, so it must render no marks —
    // and the first client render must agree, or React warns about a
    // hydration mismatch on every page carrying an indicator.
    expect(serverCompletionSnapshot().size).toBe(0);
  });

  test("WHEN called repeatedly THEN it returns the same reference", () => {
    // useSyncExternalStore compares snapshots by identity; a fresh object
    // each call would loop forever.
    expect(serverCompletionSnapshot()).toBe(serverCompletionSnapshot());
  });
});
