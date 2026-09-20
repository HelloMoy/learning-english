import { LessonId } from "@/domain/entities/ids/ids";
import { givenLearner } from "@/test-setup/learner-store/learner-store";

import { faker } from "@faker-js/faker";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import {
  savedPlaybackPositionsServerSnapshot,
  useSavedPlaybackPositions,
} from "./use-saved-playback-positions";

const aLesson = () => LessonId.parse(faker.string.uuid());

describe("useSavedPlaybackPositions", () => {
  test("WHEN nothing has been watched THEN the snapshot is empty", () => {
    const { result } = renderHook(() => useSavedPlaybackPositions());

    expect(result.current.size).toBe(0);
  });

  test("WHEN the learner has positions THEN the snapshot maps every lesson to its seconds", () => {
    const [first, second] = [aLesson(), aLesson()];
    givenLearner.positions({ [first]: 240, [second]: 12.5 });

    const { result } = renderHook(() => useSavedPlaybackPositions());

    expect(result.current.get(first)).toBe(240);
    expect(result.current.get(second)).toBe(12.5);
  });

  test("WHEN read twice with no write in between THEN the same reference comes back", () => {
    // useSyncExternalStore compares snapshots by identity; a fresh Map per
    // read would re-render forever.
    const { result, rerender } = renderHook(() => useSavedPlaybackPositions());
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });

  test("WHEN a position is written THEN every subscriber sees it", () => {
    const lessonId = aLesson();
    const first = renderHook(() => useSavedPlaybackPositions());
    const second = renderHook(() => useSavedPlaybackPositions());

    act(() => givenLearner.positions({ [lessonId]: 300 }));

    // Two surfaces reading the same store must agree — this is what the
    // shared snapshot buys over per-component state.
    expect(first.result.current.get(lessonId)).toBe(300);
    expect(second.result.current.get(lessonId)).toBe(300);
  });
});

describe("savedPlaybackPositionsServerSnapshot", () => {
  test("WHEN rendering on the server THEN the snapshot is empty and stable", () => {
    expect(savedPlaybackPositionsServerSnapshot().size).toBe(0);
    expect(savedPlaybackPositionsServerSnapshot()).toBe(savedPlaybackPositionsServerSnapshot());
  });
});
