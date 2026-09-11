"use client";

import {
  extendSeekRun,
  SEEK_RUN_WINDOW_MS,
  seekRunTarget,
  startSeekRun,
  type SeekDirection,
  type SeekRun,
  type SeekStepSeconds,
} from "@/lib/seek-run/seek-run";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Keeps a seek run alive between edge taps and ends it when the taps stop.
 *
 * @remarks
 * One entry point: `tap` says which side the learner tapped, where the video
 * was at that moment, and how far the learner's chosen step reaches. The hook
 * starts a run if none is active, extends it otherwise, restarts the lapse
 * window, and hands back the position to seek to — the caller performs the
 * seek, so the arithmetic in `seek-run` never learns about the player.
 *
 * The step is passed on every tap rather than held, because it can change
 * between two taps. `extendSeekRun` decides what to do with it: a run already
 * under way counts in the step it started with, and only a new run — a first
 * tap, or a turn-around onto the other edge — takes the one passed in.
 *
 * The run is in state so the indicator re-renders with it; it is also in a
 * ref so `tap` reads the latest run without a stale closure between two taps
 * landing in one frame. The timer is cleared on unmount.
 *
 * @returns The active run — `null` when none — and `tap`
 *
 * @category Hooks
 */
export function useSeekRun(): {
  run: SeekRun | null;
  tap: (direction: SeekDirection, currentTime: number, stepSeconds: SeekStepSeconds) => number;
} {
  const [run, setRun] = useState<SeekRun | null>(null);
  const latestRun = useRef<SeekRun | null>(null);
  const lapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const replaceRun = useCallback((next: SeekRun | null) => {
    latestRun.current = next;
    setRun(next);
  }, []);

  const restartLapseWindow = useCallback(() => {
    if (lapseTimer.current !== null) clearTimeout(lapseTimer.current);
    lapseTimer.current = setTimeout(() => replaceRun(null), SEEK_RUN_WINDOW_MS);
  }, [replaceRun]);

  const tap = useCallback(
    (direction: SeekDirection, currentTime: number, stepSeconds: SeekStepSeconds): number => {
      const active = latestRun.current;
      const next =
        active === null
          ? startSeekRun(direction, currentTime, stepSeconds)
          : extendSeekRun(active, direction, stepSeconds);
      replaceRun(next);
      restartLapseWindow();
      return seekRunTarget(next);
    },
    [replaceRun, restartLapseWindow],
  );

  useEffect(
    () => () => {
      if (lapseTimer.current !== null) clearTimeout(lapseTimer.current);
    },
    [],
  );

  return { run, tap };
}
