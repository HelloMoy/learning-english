"use client";

import type { LessonId } from "@/domain/entities/ids/ids";
import { captureProductEvent } from "@/lib/product-analytics/product-analytics";

import { useRef } from "react";
import { useDebouncedCallback } from "use-debounce";

/**
 * How long the player must go without another seek before the jump is
 * reported. Dragging the time slider seeks many times a second; this is what
 * turns a drag into the one jump the learner meant.
 */
export const SEEK_SETTLE_MS = 500;

/**
 * The only things this hook reads from a player: where playback is and how
 * fast it runs.
 *
 * @category Observability
 */
export type ReportedPlayer = {
  readonly currentTime: number;
  readonly playbackRate: number;
};

/**
 * The handlers {@link useReportPlayback} returns, one per player event.
 *
 * @category Observability
 */
export type PlaybackReport = {
  handlePlay: () => void;
  handlePause: () => void;
  handleTimeUpdate: () => void;
  handleSeeking: () => void;
  handleRateChange: () => void;
  handleEnded: () => void;
};

/**
 * Client hook: reports how a lesson video is played as named usage events.
 *
 * @remarks
 * A click on the player says a control was pressed; it does not say where in
 * the lesson, how fast, or whether the end was reached. These events do.
 * Positions are whole seconds — nothing learned from a fraction is worth the
 * noise.
 *
 * A seek is reported once it settles, as one jump from where playback was to
 * where it landed. That needs the position *before* the first seek of a run,
 * which is why the hook also listens to time updates.
 *
 * Does nothing unless product analytics was started, and PostHog itself drops
 * the events until the visitor has answered the consent question.
 *
 * @example
 * ```tsx
 * const report = useReportPlayback({ lessonId, player });
 * <MediaPlayer onPlay={report.handlePlay} onPause={report.handlePause} />
 * ```
 *
 * @param lessonId - The lesson being played
 * @param player - A handle that reads the player's clock and speed at call time
 * @returns One handler per player event
 *
 * @category Observability
 */
export function useReportPlayback({
  lessonId,
  player,
}: {
  lessonId: LessonId;
  player: ReportedPlayer;
}): PlaybackReport {
  const lastPlayedSeconds = useRef(0);
  const seekOriginSeconds = useRef<number | null>(null);

  const reportSettledSeek = useDebouncedCallback(() => {
    const toSeconds = wholeSeconds(player.currentTime);
    const fromSeconds = seekOriginSeconds.current ?? lastPlayedSeconds.current;
    captureProductEvent("video_seeked", { lessonId, fromSeconds, toSeconds });
    seekOriginSeconds.current = null;
    lastPlayedSeconds.current = toSeconds;
  }, SEEK_SETTLE_MS);

  return {
    handlePlay: () =>
      captureProductEvent("video_played", { lessonId, positionSeconds: positionOf(player) }),
    handlePause: () =>
      captureProductEvent("video_paused", { lessonId, positionSeconds: positionOf(player) }),
    handleTimeUpdate: () => {
      // While a seek is settling the clock already shows the destination.
      if (seekOriginSeconds.current === null) lastPlayedSeconds.current = positionOf(player);
    },
    handleSeeking: () => {
      seekOriginSeconds.current ??= lastPlayedSeconds.current;
      reportSettledSeek();
    },
    handleRateChange: () =>
      captureProductEvent("video_speed_changed", { lessonId, rate: player.playbackRate }),
    handleEnded: () => captureProductEvent("video_ended", { lessonId }),
  };
}

function positionOf(player: ReportedPlayer): number {
  return wholeSeconds(player.currentTime);
}

function wholeSeconds(seconds: number): number {
  return Math.floor(seconds);
}
