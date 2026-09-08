"use client";

import { isPositionResumable } from "@/lib/playback-resume-thresholds/playback-resume-thresholds";

import { useCallback, useRef, useState } from "react";

/**
 * The three calls the resume rule makes on a player, and nothing else.
 *
 * @remarks
 * Deliberately structural rather than a Vidstack type. The rule is the part
 * of this feature worth testing hardest, and it stays testable without a
 * media pipeline — jsdom has none — only while it can be driven by three
 * spies. The wrapper builds one of these from its `MediaPlayerInstance` ref.
 */
export type ResumablePlayer = {
  pause: () => void;
  play: () => void;
  seekTo: (seconds: number) => void;
};

/**
 * What the resume overlay's host needs in order to render and answer it.
 *
 * `offeredSeconds` is the position being offered, or `null` when no offer is
 * open — the host renders the overlay exactly when it is non-null.
 */
export type ResumeOnFirstPlay = {
  offeredSeconds: number | null;
  handlePlaybackStarted: () => void;
  resumeFromSavedPosition: () => void;
  restartFromBeginning: () => void;
};

/**
 * The "offer to resume on the first play" rule, with no player library in it.
 *
 * @remarks
 * The offer is made **once per mount**, and only once the learner's first
 * play has actually begun. Landing on a lesson prompts nothing: the learner
 * may have come for the notes. When playback starts, and the saved position
 * clears `isPositionResumable`, the player is paused and the position is
 * offered.
 *
 * **The hold happens on playback start, not on the play request**, and the
 * distinction is the whole reason this hook has a `handlePlaybackStarted`
 * rather than a `handlePlay`. A provider that drives a third-party embed can
 * swallow a pause issued while its initial play request is still in flight
 * and stall there for good — never emitting `pause`, never reaching
 * `playing`, ignoring every later seek and play. Waiting for playback to
 * begin puts the pause outside that window for every provider, at the cost of
 * a few milliseconds of video. See design.md §D1 of
 * `fix-youtube-resume-stuck-buffering`.
 *
 * Every answer ends with the video **playing**, because playback starting is
 * what opened the overlay. Resuming seeks to the saved position; restarting —
 * which is also where dismissal lands — seeks to `0`. Either way the offer is
 * spent and later plays go straight through.
 *
 * The saved position is read asynchronously by the caller, so it may arrive
 * after playback has started. It is not offered retroactively: interrupting a
 * learner who is already watching is worse than skipping the offer.
 *
 * @param savedPositionSeconds - The stored position, or `null` while unread or absent
 * @param durationSeconds - The lesson's length; `<= 0` is treated as unknown
 * @param player - The player to pause, seek, and play
 * @returns The open offer and the three actions that answer it
 *
 * @example
 * ```tsx
 * const resume = useResumeOnFirstPlay({ savedPositionSeconds, durationSeconds, player });
 *
 * <MediaPlayer onPlaying={resume.handlePlaybackStarted}>
 *   {resume.offeredSeconds !== null ? (
 *     <LessonVideoResumeOverlay
 *       positionSeconds={resume.offeredSeconds}
 *       onResume={resume.resumeFromSavedPosition}
 *       onRestart={resume.restartFromBeginning}
 *     />
 *   ) : null}
 * </MediaPlayer>
 * ```
 */
export function useResumeOnFirstPlay({
  savedPositionSeconds,
  durationSeconds,
  player,
}: {
  savedPositionSeconds: number | null;
  durationSeconds: number;
  player: ResumablePlayer;
}): ResumeOnFirstPlay {
  const [offeredSeconds, setOfferedSeconds] = useState<number | null>(null);
  // A ref, not state: `handlePlaybackStarted` runs from a media event and must
  // observe the flip in the same tick. As state, a second `playing` arriving
  // before the re-render would still see an unspent offer and pause the video
  // again.
  const isOfferSpentRef = useRef(false);

  const spendOfferAndPlayFrom = useCallback(
    (seconds: number) => {
      setOfferedSeconds(null);
      player.seekTo(seconds);
      player.play();
    },
    [player],
  );

  const handlePlaybackStarted = useCallback(() => {
    if (isOfferSpentRef.current) return;
    isOfferSpentRef.current = true;
    if (!isPositionResumable(savedPositionSeconds, durationSeconds)) return;

    player.pause();
    setOfferedSeconds(savedPositionSeconds);
  }, [savedPositionSeconds, durationSeconds, player]);

  const resumeFromSavedPosition = useCallback(() => {
    if (offeredSeconds === null) return;
    spendOfferAndPlayFrom(offeredSeconds);
  }, [offeredSeconds, spendOfferAndPlayFrom]);

  const restartFromBeginning = useCallback(() => {
    if (offeredSeconds === null) return;
    spendOfferAndPlayFrom(0);
  }, [offeredSeconds, spendOfferAndPlayFrom]);

  return { offeredSeconds, handlePlaybackStarted, resumeFromSavedPosition, restartFromBeginning };
}
