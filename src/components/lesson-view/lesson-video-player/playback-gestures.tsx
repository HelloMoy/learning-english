"use client";

import { useSeekRun } from "@/hooks/use-seek-run/use-seek-run";
import { SEEK_STEP_SECONDS, seekRunSeconds, type SeekDirection } from "@/lib/seek-run/seek-run";

import {
  Gesture,
  useMediaPlayer,
  useMediaRemote,
  type GestureInstance,
  type GestureWillTriggerEvent,
} from "@vidstack/react";
import { useCallback, useEffect, useRef, type RefObject } from "react";

import { SeekFeedback } from "../seek-feedback/seek-feedback";

/**
 * The player's tap gestures: a single tap toggles playback, a double tap in
 * the middle toggles fullscreen, and a double tap on an edge starts a
 * **seek run** — the YouTube app's convention, where every further tap on
 * that edge adds a step and an indicator counts them.
 *
 * @remarks
 * This is the Default Layout's gesture set minus the one that made a tap on
 * a phone only show or hide the control bar; `LessonVideoPlayer` says why.
 * Every `Gesture` listens on the provider element and checks the event's
 * coordinates against its own box, so these are regions, not targets: the
 * component sets them `pointer-events: none` itself, and the geometry the
 * layout's stylesheet would give them comes from `lesson-video-player.css`.
 *
 * **The library detects the double tap; the run seeks.** Vidstack's `dbl`
 * gesture carries the guards a raw listener would have to copy — an open
 * menu, a touch that scrolled, a pinch, the pointer button — so the seek
 * gestures keep their event and action and only hand the tap over in
 * `will-trigger`, with the library's own seek cancelled. Every seek in a run
 * then goes through one path, counted from the run's anchor rather than from
 * a `currentTime` the provider may not have updated yet.
 *
 * **While a run is active every gesture is disabled** and a `pointerup`
 * listener on the player owns the taps. The library resets its press counter
 * after a double tap, so left enabled it would read the third tap as a single
 * one and pause the video 250 ms later. The listener decides the side by
 * hit-testing against the seek gestures' own boxes, so the stylesheet stays
 * the single source of the edge geometry; a tap outside both is absorbed.
 * When the run lapses the gestures come back with their counters untouched.
 *
 * Pointer events are enough for the run's taps: a pan ends in `pointercancel`
 * rather than `pointerup`, and Vidstack's `touch-action: manipulation` on the
 * blocker already keeps a double tap from zooming the page.
 */
export function PlaybackGestures() {
  const player = useMediaPlayer();
  const remote = useMediaRemote();
  const { run, tap } = useSeekRun();
  const backwardZone = useRef<GestureInstance>(null);
  const forwardZone = useRef<GestureInstance>(null);
  const isRunActive = run !== null;

  const seekOneStep = useCallback(
    (direction: SeekDirection, trigger: Event) => {
      const target = tap(direction, player?.state.currentTime ?? 0);
      remote.seek(target, trigger);
    },
    [tap, player, remote],
  );

  const handOverDoubleTap = (direction: SeekDirection) => {
    return (_action: string, event: GestureWillTriggerEvent) => {
      event.preventDefault();
      seekOneStep(direction, event.trigger ?? event);
    };
  };

  useRunTaps({
    enabled: isRunActive,
    player: player?.el ?? null,
    backwardZone,
    forwardZone,
    seekOneStep,
  });

  return (
    <>
      <Gesture
        className="vds-gesture"
        event="pointerup"
        action="toggle:paused"
        disabled={isRunActive}
      />
      <Gesture
        className="vds-gesture"
        event="dblpointerup"
        action="toggle:fullscreen"
        disabled={isRunActive}
      />
      <Gesture
        ref={backwardZone}
        className="vds-gesture"
        event="dblpointerup"
        action={`seek:-${SEEK_STEP_SECONDS}`}
        disabled={isRunActive}
        onWillTrigger={handOverDoubleTap("backward")}
      />
      <Gesture
        ref={forwardZone}
        className="vds-gesture"
        event="dblpointerup"
        action={`seek:${SEEK_STEP_SECONDS}`}
        disabled={isRunActive}
        onWillTrigger={handOverDoubleTap("forward")}
      />
      {run !== null ? (
        <SeekFeedback
          direction={run.direction}
          seconds={seekRunSeconds(run)}
        />
      ) : null}
    </>
  );
}

/**
 * Listens for the taps that keep a run going, only while one is active.
 *
 * The listener lives on the player element, where every tap on the video
 * bubbles to, and keeps only primary-button taps that started on the
 * provider — the control bar, the resume overlay and the hint's dismiss
 * button take their own pointer, exactly as they do for the library's
 * gestures.
 */
function useRunTaps({
  enabled,
  player,
  backwardZone,
  forwardZone,
  seekOneStep,
}: {
  enabled: boolean;
  player: HTMLElement | null;
  backwardZone: RefObject<GestureInstance | null>;
  forwardZone: RefObject<GestureInstance | null>;
  seekOneStep: (direction: SeekDirection, trigger: Event) => void;
}) {
  useEffect(() => {
    if (!enabled || player === null) return;

    const onPointerUp = (event: PointerEvent) => {
      if (!isPrimaryTapOnTheVideo(event)) return;
      const direction = sideTapped(event, backwardZone.current?.el, forwardZone.current?.el);
      if (direction !== null) seekOneStep(direction, event);
    };

    player.addEventListener("pointerup", onPointerUp);
    return () => player.removeEventListener("pointerup", onPointerUp);
  }, [enabled, player, backwardZone, forwardZone, seekOneStep]);
}

function isPrimaryTapOnTheVideo(event: PointerEvent): boolean {
  return (
    event.button === 0 &&
    event.target instanceof Element &&
    event.target.closest("[data-media-provider]") !== null
  );
}

function sideTapped(
  event: PointerEvent,
  backwardZone: HTMLElement | null | undefined,
  forwardZone: HTMLElement | null | undefined,
): SeekDirection | null {
  if (contains(backwardZone, event)) return "backward";
  if (contains(forwardZone, event)) return "forward";
  return null;
}

function contains(zone: HTMLElement | null | undefined, event: PointerEvent): boolean {
  if (!zone) return false;
  const box = zone.getBoundingClientRect();
  return (
    event.clientX >= box.left &&
    event.clientX <= box.right &&
    event.clientY >= box.top &&
    event.clientY <= box.bottom
  );
}
