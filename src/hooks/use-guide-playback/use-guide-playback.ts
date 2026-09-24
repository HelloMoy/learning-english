"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import {
  useHorizontalSwipe,
  type HorizontalSwipeHandlers,
} from "../use-horizontal-swipe/use-horizontal-swipe";

/**
 * How long each frame stays on screen.
 *
 * @remarks
 * Exported so tests drive the same clock the guides do, rather than hard-coding
 * a duplicate of it that can drift.
 *
 * @category Hooks
 */
export const STEP_INTERVAL_MS = 3_500;

/**
 * The frame `delta` away, both ends wrapping.
 *
 * @remarks
 * The `+ frameCount` is what makes stepping back from the first frame land on
 * the last instead of on `-1`.
 */
const frameAfter = (index: number, delta: number, frameCount: number) =>
  (index + delta + frameCount) % frameCount;

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/**
 * The preference, read as a store rather than once inside the effect.
 *
 * @remarks
 * Deciding whether to arm a timer only needs the value once. Rendering a
 * countdown that must not exist under the preference needs it on the first
 * client render, or the guide paints a countdown and then removes it — exactly
 * the flash the preference is there to prevent. `getServerSnapshot` reports
 * `false` so the server and the hydration render agree.
 */
const subscribeToReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia?.(REDUCED_MOTION);
  query?.addEventListener("change", onChange);

  return () => query?.removeEventListener("change", onChange);
};

const prefersReducedMotion = () => window.matchMedia?.(REDUCED_MOTION).matches ?? false;

const motionIsFineOnTheServer = () => false;

/**
 * What a guide needs to play itself.
 *
 * @category Hooks
 */
export type GuidePlayback = {
  /** The frame to draw. */
  readonly frameIndex: number;
  /**
   * Whether the guide is advancing on its own. `false` under a reduced-motion
   * preference, which is what stops a countdown being drawn for a timer that
   * is not running.
   */
  readonly isPlaying: boolean;
  /** Show the frame after this one, wrapping past the last. */
  readonly showNext: () => void;
  /** Show the frame before this one, wrapping past the first. */
  readonly showPrevious: () => void;
  /** Show one frame by index, wrapping at both ends. */
  readonly showFrame: (index: number) => void;
  /** Spread onto the element a horizontal drag should move the guide by. */
  readonly swipeHandlers: HorizontalSwipeHandlers;
};

/**
 * Client hook: a guide that plays itself, and answers a drag.
 *
 * @remarks
 * Every install guide plays the same way, and this is the one place that says
 * how. Three of them read from it, so a change to the pacing cannot land on one
 * device and miss the others.
 *
 * What it buys is that the learner does nothing: the flow just runs. What that
 * costs is the learner who looks away — at the control they were sent to find,
 * or at the browser's own menu covering the page — and comes back to a guide
 * that has moved on. A horizontal drag answers that: the frame they missed is
 * one gesture back rather than a whole loop away.
 *
 * The gesture is a nudge, not a takeover. There is no pause and no manual mode
 * to get stranded in: the loop plays on, and the frame the learner landed on
 * gets a full interval of its own before it does — which is what the per-frame
 * timer below is for, rather than one interval for the whole loop. A frame
 * taken away early punishes the learner for the moment their gesture happened
 * to land in.
 *
 * Leftwards is forwards, so the finger travels the way the frame controls are
 * laid out.
 *
 * The three moves are exported because a visible control and the gesture have
 * to do the same thing. Two copies of the wrap arithmetic is two places for
 * "back from the first frame reaches the last" to stop being true.
 *
 * Under `prefers-reduced-motion` it does not advance at all. The preference is
 * read after mount — it cannot be known while rendering on the server — so the
 * first frame is painted either way and only the movement is conditional. The
 * drag keeps working there, and is the only thing that does: the preference
 * silences motion the learner did not ask for, and this is the motion they did.
 *
 * @example
 * ```tsx
 * const { frameIndex, swipeHandlers } = useGuidePlayback(FRAMES.length);
 *
 * return <section {...swipeHandlers}>{draw(FRAMES[frameIndex])}</section>;
 * ```
 *
 * @param frameCount - How many frames the guide cycles through
 * @returns The frame to draw, and the handlers that let the learner move it
 * @see useHorizontalSwipe
 * @category Hooks
 */
export function useGuidePlayback(frameCount: number): GuidePlayback {
  const [frameIndex, setFrameIndex] = useState(0);
  const isPlaying = !useSyncExternalStore(
    subscribeToReducedMotion,
    prefersReducedMotion,
    motionIsFineOnTheServer,
  );

  const showFrame = useCallback(
    (index: number) => setFrameIndex(frameAfter(index, 0, frameCount)),
    [frameCount],
  );
  const showNext = useCallback(
    () => setFrameIndex((current) => frameAfter(current, 1, frameCount)),
    [frameCount],
  );
  const showPrevious = useCallback(
    () => setFrameIndex((current) => frameAfter(current, -1, frameCount)),
    [frameCount],
  );

  const swipeHandlers = useHorizontalSwipe({
    onSwipeLeft: showNext,
    onSwipeRight: showPrevious,
  });

  useEffect(() => {
    if (!isPlaying) return;

    const timer = setTimeout(
      () => setFrameIndex(frameAfter(frameIndex, 1, frameCount)),
      STEP_INTERVAL_MS,
    );

    return () => clearTimeout(timer);
  }, [frameIndex, frameCount, isPlaying]);

  return { frameIndex, isPlaying, showNext, showPrevious, showFrame, swipeHandlers };
}
