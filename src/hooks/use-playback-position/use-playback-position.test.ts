import { recordPlaybackPositionAction } from "@/app/[locale]/learner-actions";
import { LessonId } from "@/domain/entities/ids/ids";
import type { PlaybackPositionRepository } from "@/domain/ports/playback-position-repository/playback-position-repository";
import { learnerStore } from "@/lib/learner-store/learner-store";
import { givenLearner } from "@/test-setup/learner-store/learner-store";

import { faker } from "@faker-js/faker";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { usePlaybackPosition } from "./use-playback-position";

vi.mock("@/app/[locale]/learner-actions", () => ({
  recordPlaybackPositionAction: vi.fn(),
}));

const aLesson = () => LessonId.parse(faker.string.uuid());

beforeEach(() => {
  vi.mocked(recordPlaybackPositionAction).mockReset();
  vi.mocked(recordPlaybackPositionAction).mockResolvedValue({ data: { recorded: true } } as never);
});

async function getOf(hook: { current: ReturnType<typeof usePlaybackPosition> }) {
  let value: number | null | undefined;
  await act(async () => {
    value = await hook.current.get();
  });
  return value;
}

describe("usePlaybackPosition", () => {
  test("WHEN get() is called on a lesson with no saved position THEN it returns null", async () => {
    const { result } = renderHook(() => usePlaybackPosition(aLesson()));

    expect(await getOf(result)).toBeNull();
  });

  test("WHEN the learner's snapshot holds a position THEN get() returns it", async () => {
    const lessonId = aLesson();
    givenLearner.positions({ [lessonId]: 180 });

    const { result } = renderHook(() => usePlaybackPosition(lessonId));

    expect(await getOf(result)).toBe(180);
  });

  test("WHEN set(42) is called THEN get() returns 42 and the position is saved for the learner", async () => {
    const lessonId = aLesson();
    const { result } = renderHook(() => usePlaybackPosition(lessonId));

    await act(async () => {
      await result.current.set(42);
    });

    expect(await getOf(result)).toBe(42);
    expect(recordPlaybackPositionAction).toHaveBeenCalledWith({ lessonId, seconds: 42 });
  });

  test("WHEN a position is written THEN every surface reading saved positions sees it", async () => {
    const lessonId = aLesson();
    const { result } = renderHook(() => usePlaybackPosition(lessonId));

    await act(async () => {
      await result.current.set(64);
    });

    expect(learnerStore.getState().positions.get(lessonId)).toBe(64);
  });

  describe("GIVEN an injected repository", () => {
    test("WHEN the hook runs THEN it uses that port and never the learner's server", async () => {
      // The injection seam exists so a test never has to reach the network.
      const lessonId = aLesson();
      const positions = new Map<string, number>([[lessonId, 321]]);
      const fake: PlaybackPositionRepository = {
        getPosition: async (id) => positions.get(id) ?? null,
        setPosition: async (id, seconds) => {
          positions.set(id, seconds);
        },
      };
      const { result } = renderHook(() => usePlaybackPosition(lessonId, fake));

      expect(await getOf(result)).toBe(321);
      await act(async () => {
        await result.current.set(5);
        await result.current.flush();
        result.current.flushWithBeacon();
      });
      expect(recordPlaybackPositionAction).not.toHaveBeenCalled();
    });
  });

  describe("GIVEN a value the PlaybackPosition value object rejects", () => {
    test.each([
      ["NaN", Number.NaN],
      ["Infinity", Number.POSITIVE_INFINITY],
      ["a negative", -1],
    ])("WHEN set(%s) is called THEN it reports failure and writes nothing", async (_label, bad) => {
      // A detached <video> reports NaN for currentTime, so this is the
      // realistic path, not a hypothetical.
      const lessonId = aLesson();
      const { result } = renderHook(() => usePlaybackPosition(lessonId));

      let persisted: boolean | undefined;
      await act(async () => {
        persisted = await result.current.set(bad);
      });

      expect(persisted).toBe(false);
      expect(learnerStore.getState().positions.has(lessonId)).toBe(false);
      expect(recordPlaybackPositionAction).not.toHaveBeenCalled();
    });

    test("WHEN a valid value follows a rejected one THEN it still persists", async () => {
      const lessonId = aLesson();
      const { result } = renderHook(() => usePlaybackPosition(lessonId));

      await act(async () => {
        await result.current.set(Number.NaN);
        await result.current.set(55);
      });

      // A rejected write must not leave the hook wedged.
      expect(await getOf(result)).toBe(55);
    });
  });

  test("WHEN a position is set, the hook remounts, and get() is called THEN it returns the value", async () => {
    const lessonId = aLesson();
    const first = renderHook(() => usePlaybackPosition(lessonId));
    await act(async () => {
      await first.result.current.set(99);
    });
    first.unmount();

    const second = renderHook(() => usePlaybackPosition(lessonId));

    expect(await getOf(second.result)).toBe(99);
  });
});
