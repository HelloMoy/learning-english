"use client";

import {
  extendSeekRun,
  SEEK_RUN_WINDOW_MS,
  seekRunTarget,
  startSeekRun,
  type SeekDirection,
  type SeekRun,
} from "@/lib/seek-run/seek-run";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Keeps a seek run alive between edge taps and ends it when the taps stop.
 *
 * @remarks
 * One entry point: `tap` says which side the learner tapped and where the
 * video was at that moment. The hook starts a run if none is active, extends
 * it otherwise, restarts the lapse window, and hands back the position to
 * seek to — the caller performs the seek, so the arithmetic in
 * `seek-run` never learns about the player.
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
  tap: (direction: SeekDirection, currentTime: number) => number;
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
    (direction: SeekDirection, currentTime: number): number => {
      const active = latestRun.current;
      const next =
        active === null ? startSeekRun(direction, currentTime) : extendSeekRun(active, direction);
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
