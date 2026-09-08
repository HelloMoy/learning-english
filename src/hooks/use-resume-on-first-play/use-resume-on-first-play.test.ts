import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { faker } from "@faker-js/faker";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import { useResumeOnFirstPlay, type ResumablePlayer } from "./use-resume-on-first-play";

/**
 * A lesson long enough that a mid-lesson position clears both resume
 * thresholds (30s from the start, 10s from the end).
 */
const DURATION_SECONDS = 600;
const RESUMABLE_SECONDS = 180;

/**
 * The player the hook drives, reduced to the three calls it makes. The real
 * one is a Vidstack `MediaPlayerInstance`; nothing here needs a media
 * pipeline, which is the point — see design.md §D3.
 */
function makePlayerSpy(): ResumablePlayer & {
  calls: string[];
} {
  const calls: string[] = [];
  return {
    calls,
    pause: vi.fn(() => {
      calls.push("pause");
    }),
    play: vi.fn(() => {
      calls.push("play");
    }),
    seekTo: vi.fn((seconds: number) => {
      calls.push(`seekTo:${seconds}`);
    }),
  };
}

function renderResumeHook({
  savedPositionSeconds,
  durationSeconds = DURATION_SECONDS,
  player = makePlayerSpy(),
}: {
  savedPositionSeconds: number | null;
  durationSeconds?: number;
  player?: ReturnType<typeof makePlayerSpy>;
}) {
  const view = renderHook(() =>
    useResumeOnFirstPlay({ savedPositionSeconds, durationSeconds, player }),
  );
  return { ...view, player };
}

describe("useResumeOnFirstPlay", () => {
  describe("GIVEN a saved position that is not worth resuming", () => {
    test.each([
      ["nothing is saved", null],
      ["the learner barely started", 5],
      ["the learner effectively finished", DURATION_SECONDS - 5],
    ])("WHEN %s THEN play is left alone and nothing is offered", (_case, saved) => {
      const { result, player } = renderResumeHook({ savedPositionSeconds: saved });

      act(() => {
        result.current.handlePlay();
      });

      expect(player.pause).not.toHaveBeenCalled();
      expect(result.current.offeredSeconds).toBeNull();
    });

    test("WHEN the duration is unknown THEN nothing is offered", () => {
      const { result, player } = renderResumeHook({
        savedPositionSeconds: RESUMABLE_SECONDS,
        durationSeconds: 0,
      });

      act(() => {
        result.current.handlePlay();
      });

      expect(player.pause).not.toHaveBeenCalled();
      expect(result.current.offeredSeconds).toBeNull();
    });
  });

  describe("GIVEN a saved position worth resuming", () => {
    test("WHEN the hook mounts THEN nothing is offered until the learner presses play", () => {
      const { result, player } = renderResumeHook({ savedPositionSeconds: RESUMABLE_SECONDS });

      expect(result.current.offeredSeconds).toBeNull();
      expect(player.pause).not.toHaveBeenCalled();
    });

    test("WHEN the learner presses play THEN the player pauses and the position is offered", () => {
      const { result, player } = renderResumeHook({ savedPositionSeconds: RESUMABLE_SECONDS });

      act(() => {
        result.current.handlePlay();
      });

      expect(player.pause).toHaveBeenCalledTimes(1);
      expect(result.current.offeredSeconds).toBe(RESUMABLE_SECONDS);
    });

    test("WHEN the learner resumes THEN the player seeks to the saved position and then plays", () => {
      const { result, player } = renderResumeHook({ savedPositionSeconds: RESUMABLE_SECONDS });

      act(() => {
        result.current.handlePlay();
      });
      act(() => {
        result.current.resumeFromSavedPosition();
      });

      expect(player.calls).toEqual(["pause", `seekTo:${RESUMABLE_SECONDS}`, "play"]);
      expect(result.current.offeredSeconds).toBeNull();
    });

    test("WHEN the learner restarts THEN the player seeks to zero and then plays", () => {
      const { result, player } = renderResumeHook({ savedPositionSeconds: RESUMABLE_SECONDS });

      act(() => {
        result.current.handlePlay();
      });
      act(() => {
        result.current.restartFromBeginning();
      });

      expect(player.calls).toEqual(["pause", "seekTo:0", "play"]);
      expect(result.current.offeredSeconds).toBeNull();
    });
  });

  describe("GIVEN the offer has already been answered", () => {
    test.each([
      ["resuming", (api: ReturnType<typeof useResumeOnFirstPlay>) => api.resumeFromSavedPosition()],
      ["restarting", (api: ReturnType<typeof useResumeOnFirstPlay>) => api.restartFromBeginning()],
    ])(
      "WHEN the learner presses play again after %s THEN it is not offered twice",
      (_case, answer) => {
        const { result, player } = renderResumeHook({ savedPositionSeconds: RESUMABLE_SECONDS });

        act(() => {
          result.current.handlePlay();
        });
        act(() => {
          answer(result.current);
        });
        player.calls.length = 0;

        act(() => {
          result.current.handlePlay();
        });

        expect(result.current.offeredSeconds).toBeNull();
        expect(player.calls).toEqual([]);
      },
    );

    test("WHEN the saved position arrives late but play already happened THEN it is not offered", () => {
      // The wrapper reads storage asynchronously, so `savedPositionSeconds`
      // can still be `null` on the first play. A learner who got playback
      // without a prompt must not be interrupted once the read lands.
      const player = makePlayerSpy();
      const { result, rerender } = renderHook(
        ({ saved }: { saved: number | null }) =>
          useResumeOnFirstPlay({
            savedPositionSeconds: saved,
            durationSeconds: DURATION_SECONDS,
            player,
          }),
        { initialProps: { saved: null as number | null } },
      );

      act(() => {
        result.current.handlePlay();
      });
      rerender({ saved: RESUMABLE_SECONDS });

      expect(result.current.offeredSeconds).toBeNull();
      expect(player.pause).not.toHaveBeenCalled();
    });
  });

  describe("GIVEN the hook is the project's resume policy", () => {
    test("WHEN its source is read THEN it names no player library", () => {
      // The hook is the one place the resume rule lives, and it stays
      // testable without a media pipeline only while it knows nothing about
      // Vidstack — design.md §D3.
      const source = readFileSync(
        resolve(process.cwd(), "src/hooks/use-resume-on-first-play/use-resume-on-first-play.ts"),
        "utf8",
      );

      expect(source).not.toContain("@vidstack/react");
      expect(source).toContain("playback-resume-thresholds");
    });

    test("WHEN an arbitrary resumable position is saved THEN that exact value is offered", () => {
      const saved = faker.number.int({ min: 31, max: DURATION_SECONDS - 11 });
      const { result } = renderResumeHook({ savedPositionSeconds: saved });

      act(() => {
        result.current.handlePlay();
      });

      expect(result.current.offeredSeconds).toBe(saved);
    });
  });
});
