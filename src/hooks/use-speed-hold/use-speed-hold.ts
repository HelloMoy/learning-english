"use client";

import { isPrimaryPointerOnTheVideo } from "@/lib/video-pointer/video-pointer";

import { useEffect, useRef, useState } from "react";

/**
 * The rate a hold runs the video at.
 *
 * @remarks
 * Applied absolutely, never as a multiple of the rate already in force: "hold
 * for double speed" is the promise, and a learner already at 2× has no use for
 * 4×. The hook does not apply it — {@link useSpeedHold} reports the hold and
 * the caller owns the rate — but it lives here because it is this gesture's
 * contract, and the indicator's label reads it from here too.
 */
export const HOLD_PLAYBACK_RATE = 2;

/** How long a press must last before it counts as a hold. */
export const HOLD_ARM_DELAY_MS = 500;

/**
 * How far a press may drift before the delay elapses and still be a hold.
 *
 * @remarks
 * Matches the slack Vidstack's own gestures give a touch, and it is what
 * keeps the swipe that hides the browser's toolbar — which travels through
 * the pinned player — from arming a hold.
 */
export const HOLD_MOVE_TOLERANCE_PX = 10;

/**
 * The keys that carry the hold: the player's own play/pause keys.
 *
 * @remarks
 * Spelled here rather than read from the library, so this hook stays free of
 * it; `lesson-video-player.test.tsx` pins them to the player's own table, so
 * the two cannot drift apart unnoticed.
 *
 * @category Hooks
 */
export const HOLD_KEYS = [" ", "k"];

/** Elements that own the key when they have focus, so the gesture leaves it. */
const FOCUSABLE_KEY_OWNERS = "button, input, textarea, select, a[href], [contenteditable]";

type PressOrigin = { clientX: number; clientY: number };

/** A press in flight, and which input it belongs to. */
type Press = { input: "pointer"; origin: PressOrigin } | { input: "key" };

/**
 * Whatever owns the element the gesture listens on — the media player, in
 * every real caller. Typed by its shape rather than by the library's own
 * `MediaPlayerInstance` so this hook stays testable without a media provider.
 */
type ElementOwner = { el: HTMLElement | null };

/**
 * Reports whether the learner is pressing and holding the video.
 *
 * @remarks
 * **The hold is timed here because the library has no event for it.**
 * Vidstack's `Gesture` knows `pointerup`, `dblpointerup` and the provider's
 * media events; the nearest it offers is an action on the release, which
 * would speed the video up at the moment the finger *lifts* — the opposite of
 * the gesture. So the press is timed against the player element, the same
 * node `PlaybackGestures` already listens on for a seek run's taps.
 *
 * **The hook says when, not what.** It reports a boolean and changes no
 * playback rate: the rate to apply, and the rate to put back, belong to the
 * caller that holds the player and the remote. That keeps everything here
 * testable without a media provider.
 *
 * **A press that drifts is a swipe, not a hold.** Enlarged, the player
 * deliberately never locks the page's scroll, because on an iPhone only a real
 * swipe travelling through the pinned player hides Safari's toolbar. A finger
 * resting there on its way to that swipe is a frequent, ordinary event, so a
 * press that moves past {@link HOLD_MOVE_TOLERANCE_PX} before the delay arms
 * nothing. Once armed, movement is ignored — the finger is deliberately down —
 * and the browser's own `pointercancel` ends the hold when it claims the touch
 * for the scroll.
 *
 * Releases are heard on the document rather than on the player: a finger that
 * wandered off the player before lifting would otherwise leave a hold armed
 * with nothing left to end it.
 *
 * **The play/pause key is taken from the library in the capture phase.**
 * Vidstack binds `Space` and `K` to `togglePaused` and acts on **keydown**, so
 * a learner who held the key would have the lesson paused half a second before
 * the hold could arm. Its listener is on the player element and it stops the
 * event there, so the only place left to intercept is the document, capturing —
 * which also means the library never sees the key at all and cannot toggle
 * twice. The tap it used to handle is reported back through `onKeyTap`.
 *
 * The library does offer a shortcut table that can carry a handler, and it was
 * tried first. It cannot be relied on: the chrome's play button registers the
 * same shortcut through `aria-keyshortcuts`, and that registration is a plain
 * key list that overrides whatever the table holds — so the handler is skipped
 * and the library toggles anyway.
 *
 * **A release is reported one frame late, on purpose.** The browser delivers a
 * touch release as `pointerup` and then `touchend`, and Vidstack's tap gesture
 * listens for the second of those on a coarse pointer. Ending the hold between
 * the two would re-enable that gesture in time for it to read the release as a
 * tap — which is exactly how releasing a hold used to pause the lesson on an
 * iPhone while leaving a mouse unaffected. Waiting for the next animation frame
 * puts the whole release behind us before the caller is told.
 *
 * `contextmenu` is suppressed while a press is in flight, so a desktop press
 * does not raise a menu over the indicator it just drew. Its touch counterpart
 * — iOS Safari's callout — is not an event and is turned off in the player's
 * stylesheet instead.
 *
 * @param player - The player whose element every pointer event on the chrome
 *                 bubbles to. Its element is read when the listeners are
 *                 attached, not while rendering, and the player itself must
 *                 keep its identity between renders — a fresh object each
 *                 render re-attaches the listeners and drops a hold in flight
 * @param onKeyTap - Called when the play/pause key was released before it
 *                   became a hold. The library no longer toggles playback for
 *                   that key, so the caller performs the tap
 * @param enabled - Whether a press may become a hold at all. The caller lowers
 *                  it while the video is paused, while the provider cannot have
 *                  its rate set, and while a seek run owns the taps; lowering it
 *                  mid-hold ends the hold
 * @returns `true` while a hold is armed
 *
 * @example
 * ```tsx
 * const isHolding = useSpeedHold({ player: useMediaPlayer(), enabled: isPlaying });
 * ```
 *
 * @category Hooks
 */
export function useSpeedHold({
  player,
  enabled,
  onKeyTap,
}: {
  player: ElementOwner | null;
  enabled: boolean;
  onKeyTap?: () => void;
}): boolean {
  const [isHolding, setIsHolding] = useState(false);
  const press = useRef<Press | null>(null);
  const armTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const releaseFrame = useRef<number | null>(null);
  const reportKeyTap = useRef(onKeyTap);

  // In a ref, not in the effect's dependencies: the caller writes this inline,
  // and re-attaching the listeners on every render would drop a hold in flight.
  useEffect(() => {
    reportKeyTap.current = onKeyTap;
  });

  useEffect(() => {
    // Read inside the effect, never during render: the player element is
    // assigned while the tree mounts, and nothing re-renders this hook's
    // caller afterwards to hand it a second chance.
    const playerElement = player?.el;
    if (!playerElement) return;

    const forgetPress = () => {
      if (armTimer.current !== null) clearTimeout(armTimer.current);
      armTimer.current = null;
      press.current = null;
    };

    const cancelReleaseFrame = () => {
      if (releaseFrame.current !== null) cancelAnimationFrame(releaseFrame.current);
      releaseFrame.current = null;
    };

    const endPress = () => {
      forgetPress();
      cancelReleaseFrame();
      releaseFrame.current = requestAnimationFrame(() => {
        releaseFrame.current = null;
        setIsHolding(false);
      });
    };

    const beginPress = (started: Press) => {
      press.current = started;
      armTimer.current = setTimeout(() => {
        armTimer.current = null;
        setIsHolding(true);
      }, HOLD_ARM_DELAY_MS);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (press.current !== null) {
        if (press.current.input === "pointer") endPress();
        return;
      }
      if (!enabled || !isPrimaryPointerOnTheVideo(event)) return;
      beginPress({ input: "pointer", origin: { clientX: event.clientX, clientY: event.clientY } });
    };

    const onPointerMove = (event: PointerEvent) => {
      const inFlight = press.current;
      if (armTimer.current === null || inFlight?.input !== "pointer") return;
      if (hasDriftedPastTolerance(inFlight.origin, event)) endPress();
    };

    const onPointerRelease = () => {
      if (press.current?.input === "pointer") endPress();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (!enabled || !isHoldKeyOnThePlayer(event, playerElement)) return;
      // Before anything else, and on a repeat too: the library acts on this
      // key's keydown, and a repeat left to it would toggle playback under
      // the hold.
      event.preventDefault();
      event.stopPropagation();
      // A held key repeats; read as a second press it would end the hold it
      // had just started.
      if (press.current !== null) return;
      beginPress({ input: "key" });
    };

    const onKeyUp = () => {
      if (press.current?.input !== "key") return;
      const wasNeverArmed = armTimer.current !== null;
      endPress();
      if (wasNeverArmed) reportKeyTap.current?.();
    };

    const onContextMenu = (event: Event) => {
      if (press.current !== null) event.preventDefault();
    };

    const releases = playerElement.ownerDocument;
    playerElement.addEventListener("pointerdown", onPointerDown);
    playerElement.addEventListener("pointermove", onPointerMove);
    playerElement.addEventListener("contextmenu", onContextMenu);
    releases.addEventListener("keydown", onKeyDown, { capture: true });
    releases.addEventListener("pointerup", onPointerRelease);
    releases.addEventListener("pointercancel", onPointerRelease);
    releases.addEventListener("keyup", onKeyUp);

    return () => {
      playerElement.removeEventListener("pointerdown", onPointerDown);
      playerElement.removeEventListener("pointermove", onPointerMove);
      playerElement.removeEventListener("contextmenu", onContextMenu);
      releases.removeEventListener("keydown", onKeyDown, { capture: true });
      releases.removeEventListener("pointerup", onPointerRelease);
      releases.removeEventListener("pointercancel", onPointerRelease);
      releases.removeEventListener("keyup", onKeyUp);
      forgetPress();
      cancelReleaseFrame();
      setIsHolding(false);
    };
  }, [player, enabled]);

  return isHolding;
}

/**
 * Whether a key event is the hold's, meant for the player rather than for a
 * control inside it.
 *
 * @remarks
 * The player itself takes focus (Vidstack gives it `tabindex`), and that is
 * where the key is the gesture's. A focused button, link or text field keeps
 * it — `Space` activates a button, and taking that would break the chrome's
 * keyboard. Modifier combinations belong to the browser.
 */
function isHoldKeyOnThePlayer(event: KeyboardEvent, player: HTMLElement): boolean {
  if (!HOLD_KEYS.includes(event.key) || event.metaKey || event.ctrlKey || event.altKey)
    return false;
  const focused = player.ownerDocument.activeElement;
  return focused !== null && player.contains(focused) && !focused.matches(FOCUSABLE_KEY_OWNERS);
}

function hasDriftedPastTolerance(origin: PressOrigin, event: PointerEvent): boolean {
  const drift = Math.hypot(event.clientX - origin.clientX, event.clientY - origin.clientY);
  return drift > HOLD_MOVE_TOLERANCE_PX;
}
