import { LessonId } from "@/domain/entities/ids/ids";
import type { PlaybackPositionRepository } from "@/domain/ports/playback-position-repository/playback-position-repository";

import { faker } from "@faker-js/faker";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { usePersistPlaybackPosition, type PositionedPlayer } from "./use-persist-playback-position";

const DEBOUNCE_MS = 1500;

/** A player whose `currentTime` the test moves by hand. */
function makePlayerAt(seconds: number): PositionedPlayer & { currentTime: number } {
  return { currentTime: seconds };
}

function makeRecordingRepository(): PlaybackPositionRepository & { writes: number[] } {
  const writes: number[] = [];
  return {
    writes,
    getPosition: async () => null,
    setPosition: async (_lessonId, seconds) => {
      writes.push(seconds);
    },
  };
}

function renderPersistence({
  player,
  repository = makeRecordingRepository(),
  lessonId = LessonId.parse(faker.string.uuid()),
}: {
  player: PositionedPlayer;
  repository?: ReturnType<typeof makeRecordingRepository>;
  lessonId?: LessonId;
}) {
  const view = renderHook(() => usePersistPlaybackPosition({ lessonId, player, repository }));
  return { ...view, repository, lessonId };
}

/** Lets the hook's async writes settle after the timers that triggered them. */
const flushWrites = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("usePersistPlaybackPosition", () => {
  describe("GIVEN the learner has not interacted with the player", () => {
    test("WHEN time updates arrive THEN nothing is written", async () => {
      // A cold load fires `time-update` at 0. Writing it would erase the very
      // position the page is about to offer to resume from.
      const player = makePlayerAt(0);
      const { result, repository } = renderPersistence({ player });

      act(() => {
        result.current.handleTimeUpdate();
        vi.advanceTimersByTime(DEBOUNCE_MS * 2);
      });
      await flushWrites();

      expect(repository.writes).toEqual([]);
    });

    test("WHEN the player pauses THEN nothing is written", async () => {
      const player = makePlayerAt(42);
      const { result, repository } = renderPersistence({ player });

      act(() => {
        result.current.handleImmediateWrite();
      });
      await flushWrites();

      expect(repository.writes).toEqual([]);
    });
  });

  describe("GIVEN the learner has interacted with the player", () => {
    test("WHEN time updates arrive in a burst THEN writes are debounced", async () => {
      const player = makePlayerAt(10);
      const { result, repository } = renderPersistence({ player });

      act(() => {
        result.current.openWriteGate();
      });

      // Five seconds of `time-update` at 250ms intervals: 20 events, which a
      // 1500ms debounce collapses into at most three writes.
      act(() => {
        for (let elapsed = 0; elapsed < 5000; elapsed += 250) {
          player.currentTime = 10 + elapsed / 1000;
          result.current.handleTimeUpdate();
          vi.advanceTimersByTime(250);
        }
      });
      await flushWrites();

      expect(repository.writes.length).toBeGreaterThan(0);
      expect(repository.writes.length).toBeLessThanOrEqual(3);
    });

    test("WHEN a pause arrives THEN the position is written without waiting for the debounce", async () => {
      const player = makePlayerAt(45);
      const { result, repository } = renderPersistence({ player });

      act(() => {
        result.current.openWriteGate();
        result.current.handleImmediateWrite();
      });
      await flushWrites();

      expect(repository.writes).toEqual([45]);
    });

    test("WHEN an arbitrary position is reached and the player pauses THEN that exact position is stored", async () => {
      const seconds = faker.number.int({ min: 1, max: 3600 });
      const player = makePlayerAt(seconds);
      const { result, repository } = renderPersistence({ player });

      act(() => {
        result.current.openWriteGate();
        result.current.handleImmediateWrite();
      });
      await flushWrites();

      expect(repository.writes).toEqual([seconds]);
    });

    test("WHEN the position is written THEN it is keyed by the lesson", async () => {
      const player = makePlayerAt(90);
      const lessonId = LessonId.parse(faker.string.uuid());
      const setPosition = vi.fn(async () => {});
      const repository: PlaybackPositionRepository = {
        getPosition: async () => null,
        setPosition,
      };
      const { result } = renderHook(() =>
        usePersistPlaybackPosition({ lessonId, player, repository }),
      );

      act(() => {
        result.current.openWriteGate();
        result.current.handleImmediateWrite();
      });
      await flushWrites();

      expect(setPosition).toHaveBeenCalledWith(lessonId, 90);
    });
  });

  describe("GIVEN the learner leaves the page", () => {
    test("WHEN the hook unmounts with a pending write THEN that write is flushed", async () => {
      const player = makePlayerAt(120);
      const { result, repository, unmount } = renderPersistence({ player });

      act(() => {
        result.current.openWriteGate();
        result.current.handleTimeUpdate();
      });
      // Unmount well inside the debounce window — the pending write must not
      // be dropped just because the learner navigated away.
      act(() => {
        vi.advanceTimersByTime(100);
        unmount();
      });
      await flushWrites();

      expect(repository.writes).toEqual([120]);
    });

    test("WHEN the window unloads THEN the latest position is written", async () => {
      const player = makePlayerAt(200);
      const { result, repository } = renderPersistence({ player });

      act(() => {
        result.current.openWriteGate();
      });
      act(() => {
        window.dispatchEvent(new Event("beforeunload"));
      });
      await flushWrites();

      expect(repository.writes).toEqual([200]);
    });

    test("WHEN the hook has unmounted THEN unloading writes nothing more", async () => {
      const player = makePlayerAt(200);
      const { result, repository, unmount } = renderPersistence({ player });

      act(() => {
        result.current.openWriteGate();
        unmount();
      });
      await flushWrites();
      repository.writes.length = 0;

      act(() => {
        window.dispatchEvent(new Event("beforeunload"));
      });
      await flushWrites();

      expect(repository.writes).toEqual([]);
    });
  });

  describe("GIVEN a position the value object rejects", () => {
    test("WHEN the player reports NaN THEN nothing is written", async () => {
      // A detached media element reports `NaN` for `currentTime` mid-teardown.
      const player = makePlayerAt(Number.NaN);
      const { result, repository } = renderPersistence({ player });

      act(() => {
        result.current.openWriteGate();
        result.current.handleImmediateWrite();
      });
      await flushWrites();

      expect(repository.writes).toEqual([]);
    });
  });
});
