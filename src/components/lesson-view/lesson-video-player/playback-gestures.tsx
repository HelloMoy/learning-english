"use client";

import { useSeekRun } from "@/hooks/use-seek-run/use-seek-run";
import { useSeekStep } from "@/hooks/use-seek-step/use-seek-step";
import { HOLD_PLAYBACK_RATE, useSpeedHold } from "@/hooks/use-speed-hold/use-speed-hold";
import { seekRunSeconds, type SeekDirection } from "@/lib/seek-run/seek-run";
import { isPrimaryPointerOnTheVideo } from "@/lib/video-pointer/video-pointer";

import {
  Gesture,
  useMediaPlayer,
  useMediaRemote,
  useMediaState,
  type GestureInstance,
  type GestureWillTriggerEvent,
} from "@vidstack/react";
import { useCallback, useEffect, useRef, type RefObject } from "react";

import { SeekFeedback } from "../seek-feedback/seek-feedback";
import { SpeedFeedback } from "../speed-feedback/speed-feedback";

/**
 * The class that marks a gesture as one of the two edge regions.
 *
 * @remarks
 * `lesson-video-player.css` sizes the regions by this class rather than by
 * their `action`, because the action spells the learner's chosen step — a
 * selector written against one step leaves the other two covering the whole
 * frame. Exported so a test can find a region without knowing the step either.
 *
 * @category Components
 */
export const SEEK_ZONE_CLASS = "lesson-video-player__seek-zone";

/**
 * The player's pointer gestures: a single tap toggles playback, a double tap
 * in the middle toggles fullscreen, a double tap on an edge starts a **seek
 * run** — where every further tap on that edge adds a step and an indicator
 * counts them — and a press held on the frame runs the lesson at double speed
 * until it is released. All four are the YouTube app's conventions, which the
 * learner's thumbs already know.
 *
 * @remarks
 * This is the Default Layout's gesture set minus the one that made a tap on
 * a phone only show or hide the control bar; `LessonVideoPlayer` says why.
 * Every `Gesture` listens on the provider element and checks the event's
 * coordinates against its own box, so these are regions, not targets: the
 * component sets them `pointer-events: none` itself, and the geometry the
 * layout's stylesheet would give them comes from `lesson-video-player.css`,
 * which finds the two edge regions by {@link SEEK_ZONE_CLASS} — never by the
 * step their action spells.
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
 * **The step is the learner's, read fresh on every tap.** `useSeekStep` holds
 * it, `SeekStepMenu` changes it, and it reaches both the gesture actions and
 * the run from here — no number is spelled in this file. A run already under
 * way keeps the step it started with; `extendSeekRun` says why.
 *
 * Pointer events are enough for the run's taps: a pan ends in `pointercancel`
 * rather than `pointerup`, and Vidstack's `touch-action: manipulation` on the
 * blocker already keeps a double tap from zooming the page.
 *
 * **The hold is this app's own gesture, and it disables the others the same
 * way.** The library has no press-and-hold event — `useSpeedHold` says why it
 * is timed here — so this component only decides *when one may start* and
 * *what it does*. It may start while the lesson is playing, while the
 * provider will take a rate change, and while no seek run owns the taps;
 * `useDoubleSpeedWhileHolding` applies the rate and puts the learner's own
 * one back. While a hold is armed every `Gesture` is `disabled`, so the
 * release that ends it is never counted as a tap and never toggles playback
 * — the same mechanism, and the same reason, as during a run.
 */
export function PlaybackGestures() {
  const player = useMediaPlayer();
  const remote = useMediaRemote();
  const { run, tap } = useSeekRun();
  const { stepSeconds } = useSeekStep();
  const backwardZone = useRef<GestureInstance>(null);
  const forwardZone = useRef<GestureInstance>(null);
  const isRunActive = run !== null;
  const isPaused = useMediaState("paused");
  const canSetPlaybackRate = useMediaState("canSetPlaybackRate");
  const isHolding = useSpeedHold({
    player,
    enabled: !isRunActive && !isPaused && canSetPlaybackRate,
    // The library no longer acts on the play/pause key — the shortcut table
    // hands it to the hold — so the tap it used to handle is performed here.
    onKeyTap: () => remote.togglePaused(),
  });

  useDoubleSpeedWhileHolding(isHolding);

  const seekOneStep = useCallback(
    (direction: SeekDirection, trigger: Event) => {
      const target = tap(direction, player?.state.currentTime ?? 0, stepSeconds);
      remote.seek(target, trigger);
    },
    [tap, stepSeconds, player, remote],
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
        disabled={isRunActive || isHolding}
      />
      <Gesture
        className="vds-gesture"
        event="dblpointerup"
        action="toggle:fullscreen"
        disabled={isRunActive || isHolding}
      />
      <Gesture
        ref={backwardZone}
        className={`vds-gesture ${SEEK_ZONE_CLASS}`}
        event="dblpointerup"
        action={`seek:-${stepSeconds}`}
        disabled={isRunActive || isHolding}
        onWillTrigger={handOverDoubleTap("backward")}
      />
      <Gesture
        ref={forwardZone}
        className={`vds-gesture ${SEEK_ZONE_CLASS} ${SEEK_ZONE_CLASS}--forward`}
        event="dblpointerup"
        action={`seek:${stepSeconds}`}
        disabled={isRunActive || isHolding}
        onWillTrigger={handOverDoubleTap("forward")}
      />
      {run !== null ? (
        <SeekFeedback
          direction={run.direction}
          seconds={seekRunSeconds(run)}
        />
      ) : null}
      {isHolding ? <SpeedFeedback rate={HOLD_PLAYBACK_RATE} /> : null}
    </>
  );
}

/**
 * Runs the video at {@link HOLD_PLAYBACK_RATE} while a hold is armed and puts
 * the learner's own rate back when it ends.
 *
 * @remarks
 * The rate to put back is remembered while no hold is in flight, because by
 * the time the hold ends the player is reporting the hold's own rate. Reading
 * the player's rate inside the effect instead would be one line shorter and
 * wrong for the same reason.
 *
 * The restore rides the effect's cleanup, so every way a hold can end — the
 * finger lifting, the browser cancelling the pointer, the gesture leaving the
 * tree — puts the rate back through one path.
 */
function useDoubleSpeedWhileHolding(isHolding: boolean) {
  const remote = useMediaRemote();
  const playbackRate = useMediaState("playbackRate");
  const rateBeforeTheHold = useRef(playbackRate);

  useEffect(() => {
    if (!isHolding) rateBeforeTheHold.current = playbackRate;
  }, [isHolding, playbackRate]);

  useEffect(() => {
    if (!isHolding) return;
    const rateToRestore = rateBeforeTheHold.current;
    remote.changePlaybackRate(HOLD_PLAYBACK_RATE);
    return () => {
      remote.changePlaybackRate(rateToRestore);
    };
  }, [isHolding, remote]);
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
      if (!isPrimaryPointerOnTheVideo(event)) return;
      const direction = sideTapped(event, backwardZone.current?.el, forwardZone.current?.el);
      if (direction !== null) seekOneStep(direction, event);
    };

    player.addEventListener("pointerup", onPointerUp);
    return () => player.removeEventListener("pointerup", onPointerUp);
  }, [enabled, player, backwardZone, forwardZone, seekOneStep]);
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
