"use client";

import { useRef } from "react";

/**
 * How far the pointer must travel sideways before the movement counts as a
 * swipe.
 *
 * @remarks
 * Roughly a thumb's width: short enough that a deliberate flick always clears
 * it, long enough that the wander of a tap never does. Exported so a caller —
 * or a test — reads the same number the hook measures against rather than
 * keeping a copy that drifts.
 *
 * @category Hooks
 */
export const SWIPE_THRESHOLD_PX = 48;

/** The part of a pointer event a swipe is measured from. */
type PointerPosition = {
  clientX: number;
  clientY: number;
};

type HorizontalSwipeCallbacks = {
  /** Runs when the pointer travelled leftwards far enough to be a swipe. */
  onSwipeLeft: () => void;
  /** Runs when the pointer travelled rightwards far enough to be a swipe. */
  onSwipeRight: () => void;
};

/**
 * Pointer handlers to spread on the element the gesture happens over.
 *
 * @category Hooks
 */
export type HorizontalSwipeHandlers = {
  onPointerDown: (position: PointerPosition) => void;
  onPointerUp: (position: PointerPosition) => void;
  onPointerCancel: () => void;
};

/**
 * Client hook: a sideways drag over an element, as a pair of callbacks.
 *
 * @remarks
 * Pointer events rather than touch events, so one code path covers a finger, a
 * trackpad and a mouse — and so the gesture can be driven in a test and in
 * Storybook without synthesising the `TouchList` objects jsdom does not build.
 *
 * The callbacks are named after **the finger**, not after what the movement
 * means. What the hand did is all this hook knows; what it should do is the
 * caller's to decide, which is also where a right-to-left locale would one day
 * reverse the mapping without this file changing.
 *
 * A movement counts only if it travels at least {@link SWIPE_THRESHOLD_PX}
 * sideways **and** travels further sideways than up or down. The second half is
 * what leaves a scrolling page alone: a drag aimed at the document is
 * vertically dominant, and this declines it however far sideways it drifts.
 *
 * The pressed-at coordinate lives in a ref rather than in state: nothing
 * renders it, and storing it in state would repaint the element mid-gesture for
 * no visible change.
 *
 * A drag released outside the element is not seen, since the handlers sit on
 * the element itself; the pointer is not captured, because capturing it would
 * put `setPointerCapture` — which jsdom does not implement — on the path every
 * test has to walk.
 *
 * @example
 * ```tsx
 * const swipeHandlers = useHorizontalSwipe({
 *   onSwipeLeft: showNextFrame,
 *   onSwipeRight: showPreviousFrame,
 * });
 *
 * <section {...swipeHandlers}>…</section>
 * ```
 *
 * @param callbacks - What to run for each direction the finger can travel
 * @returns Handlers to spread on the element the gesture happens over
 * @category Hooks
 */
export function useHorizontalSwipe({
  onSwipeLeft,
  onSwipeRight,
}: HorizontalSwipeCallbacks): HorizontalSwipeHandlers {
  const pressedAt = useRef<PointerPosition | null>(null);

  const forgetGesture = () => {
    pressedAt.current = null;
  };

  const releaseAt = (position: PointerPosition) => {
    const start = pressedAt.current;
    if (!start) return;

    forgetGesture();

    const travelledX = position.clientX - start.clientX;
    const travelledY = position.clientY - start.clientY;

    if (Math.abs(travelledX) < SWIPE_THRESHOLD_PX) return;
    if (Math.abs(travelledY) >= Math.abs(travelledX)) return;

    if (travelledX < 0) onSwipeLeft();
    else onSwipeRight();
  };

  return {
    onPointerDown: (position) => {
      pressedAt.current = { clientX: position.clientX, clientY: position.clientY };
    },
    onPointerUp: releaseAt,
    onPointerCancel: forgetGesture,
  };
}
