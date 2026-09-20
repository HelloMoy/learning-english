import {
  markLessonCompleteAction,
  unmarkLessonCompleteAction,
} from "@/app/[locale]/learner-actions";
import { LessonId } from "@/domain/entities/ids/ids";
import { EMPTY_LEARNER_SNAPSHOT } from "@/lib/learner-snapshot/learner-snapshot";
import { seedLearnerStore } from "@/lib/learner-store/learner-store";

import { faker } from "@faker-js/faker";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import {
  markLessonComplete,
  serverCompletionSnapshot,
  unmarkLessonComplete,
  useCompletedLessons,
  useLessonCompletion,
} from "./use-lesson-completion";

vi.mock("@/app/[locale]/learner-actions", () => ({
  markLessonCompleteAction: vi.fn(),
  unmarkLessonCompleteAction: vi.fn(),
}));

const aLesson = () => LessonId.parse(faker.string.uuid());

beforeEach(() => {
  vi.mocked(markLessonCompleteAction).mockResolvedValue({ data: { completed: true } } as never);
  vi.mocked(unmarkLessonCompleteAction).mockResolvedValue({ data: { unmarked: true } } as never);
});

describe("useLessonCompletion", () => {
  test("WHEN a lesson has not been marked THEN it reports incomplete", () => {
    const { result } = renderHook(() => useLessonCompletion(aLesson()));

    expect(result.current).toBe(false);
  });

  test("WHEN the learner's snapshot holds the lesson THEN it reports complete", () => {
    const lessonId = aLesson();
    seedLearnerStore({ ...EMPTY_LEARNER_SNAPSHOT, completedLessonIds: [lessonId] });

    const { result } = renderHook(() => useLessonCompletion(lessonId));

    expect(result.current).toBe(true);
  });

  test("WHEN a lesson is marked THEN every subscriber updates without a reload", async () => {
    const lessonId = aLesson();
    const first = renderHook(() => useLessonCompletion(lessonId));
    const second = renderHook(() => useLessonCompletion(lessonId));

    await act(async () => {
      await markLessonComplete(lessonId);
    });

    // Two components reading the same lesson must agree — this is what the
    // shared store buys over per-component state.
    expect(first.result.current).toBe(true);
    expect(second.result.current).toBe(true);
    expect(markLessonCompleteAction).toHaveBeenCalledWith({ lessonId });
  });

  test("WHEN the server accepts a mark THEN the call reports success", async () => {
    await expect(markLessonComplete(aLesson())).resolves.toBe(true);
  });

  test("WHEN the server refuses a mark THEN it is withdrawn and the call reports failure", async () => {
    vi.mocked(markLessonCompleteAction).mockResolvedValue({ serverError: "no session" } as never);
    const lessonId = aLesson();
    const { result } = renderHook(() => useLessonCompletion(lessonId));

    let saved = true;
    await act(async () => {
      saved = await markLessonComplete(lessonId);
    });

    expect(saved).toBe(false);
    expect(result.current).toBe(false);
  });

  test("WHEN one lesson is marked THEN another is unaffected", async () => {
    const { result } = renderHook(() => useLessonCompletion(aLesson()));

    await act(async () => {
      await markLessonComplete(aLesson());
    });

    expect(result.current).toBe(false);
  });
});

describe("useCompletedLessons", () => {
  test("WHEN nothing changes THEN the same set is returned, so readers do not loop", () => {
    const { result, rerender } = renderHook(() => useCompletedLessons());
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });
});

describe("unmarkLessonComplete", () => {
  test("WHEN a completed lesson is unmarked THEN every subscriber sees it incomplete", async () => {
    const lessonId = aLesson();
    seedLearnerStore({ ...EMPTY_LEARNER_SNAPSHOT, completedLessonIds: [lessonId] });
    const first = renderHook(() => useLessonCompletion(lessonId));
    const second = renderHook(() => useLessonCompletion(lessonId));

    await act(async () => {
      await unmarkLessonComplete(lessonId);
    });

    // The undo travels through the same shared snapshot the mark does, so
    // no surface is left claiming the lesson is complete.
    expect(first.result.current).toBe(false);
    expect(second.result.current).toBe(false);
    expect(unmarkLessonCompleteAction).toHaveBeenCalledWith({ lessonId });
  });

  test("WHEN the server refuses an un-mark THEN the mark comes back and the call reports failure", async () => {
    vi.mocked(unmarkLessonCompleteAction).mockResolvedValue({ serverError: "no session" } as never);
    const lessonId = aLesson();
    seedLearnerStore({ ...EMPTY_LEARNER_SNAPSHOT, completedLessonIds: [lessonId] });

    await expect(unmarkLessonComplete(lessonId)).resolves.toBe(false);

    const { result } = renderHook(() => useLessonCompletion(lessonId));
    expect(result.current).toBe(true);
  });
});

describe("serverCompletionSnapshot", () => {
  test("WHEN rendering on the server THEN the snapshot is empty", () => {
    // The server renders no marks, and the first client render must agree,
    // or React warns about a hydration mismatch on every page carrying an
    // indicator.
    expect(serverCompletionSnapshot().size).toBe(0);
  });

  test("WHEN called repeatedly THEN it returns the same reference", () => {
    // useSyncExternalStore compares snapshots by identity; a fresh object
    // each call would loop forever.
    expect(serverCompletionSnapshot()).toBe(serverCompletionSnapshot());
  });
});
