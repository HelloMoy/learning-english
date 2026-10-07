"use client";

import type { SeekDirection } from "@/lib/seek-run/seek-run";

import { useEffect, useRef } from "react";

/**
 * The keys that seek, by the way they move the video: the player's own seek
 * shortcuts.
 *
 * @remarks
 * Spelled here rather than read from the library, so this hook stays free of
 * it; `lesson-video-player.test.tsx` pins them to the player's own table, so
 * the two cannot drift apart unnoticed.
 *
 * @category Hooks
 */
export const SEEK_KEYS: Record<SeekDirection, readonly string[]> = {
  backward: ["j", "J", "ArrowLeft"],
  forward: ["l", "L", "ArrowRight"],
};

/**
 * Elements that use these keys themselves when they have focus, so the seek
 * leaves the key to them.
 *
 * @remarks
 * The library's own ignore list, plus every slider but one. The volume
 * slider's arrows change the volume. The time slider's arrows are the very
 * seek this hook takes over, and a click on the timeline leaves focus there —
 * left to the slider, the next arrow press would move by the layout's step
 * instead of the learner's.
 */
const SEEK_KEY_OWNERS =
  'input, textarea, select, [contenteditable], [role^="menuitem"], [role="timer"], [role="slider"]:not([data-media-time-slider])';

/**
 * Whatever owns the element the keys belong to — the media player, in every
 * real caller. Typed by its shape rather than by the library's own
 * `MediaPlayerInstance` so this hook stays testable without a media provider.
 */
type ElementOwner = { el: HTMLElement | null };

/**
 * Takes the player's seek keys from the library and reports the direction each
 * one asks for.
 *
 * @remarks
 * **The hook says which way, not how far.** It reports a direction and seeks
 * nothing: the step, the run it joins and the indicator that answers belong to
 * the caller that holds the player and the remote. Whether a seek may happen
 * at all is the caller's too — a key reported here has already been taken, so
 * a caller that declines it leaves the press with no effect, which is what
 * keeps the library's own keyboard display from answering instead.
 *
 * **The keys are taken in the capture phase, on the document.** Vidstack binds
 * them to its own seek, by its layout's step, and answers with its own
 * display. Its listener is on the player element, and a focused time slider
 * handles its arrows before even that — so the one place that runs ahead of
 * both is the document, capturing. `useSpeedHold` records why the library's
 * shortcut table is not the way to do this.
 *
 * **The release is taken too.** The library commits a keyboard seek on
 * *keyup*, to a position it worked out on keydown. Handed a release whose
 * press it never saw, it has no position and seeks to none.
 *
 * **Every repeat is reported.** A key held down is a learner scrubbing, and
 * each repeat the platform sends is one more step. The caller's run counts
 * from where it started rather than from where the video is, so a repeat that
 * arrives before the previous seek has landed loses nothing.
 *
 * `Meta`, `Ctrl` and `Alt` leave the key to the browser — `Alt` with an arrow
 * is "back". `Shift` does not, because the letter keys are typed with it.
 *
 * @param player - The player the keys belong to. Its element is read when the
 *                 listeners are attached, not while rendering, and the player
 *                 itself must keep its identity between renders
 * @param enabled - Whether the keys are taken at all. The caller lowers it
 *                  while the player's own shortcuts are suppressed, and the
 *                  keys are then left exactly where they were
 * @param onSeek - Called with the direction a seek key asks for and the event
 *                 that carried it, on every press and every repeat
 *
 * @example
 * ```tsx
 * useSeekKeys({
 *   player: useMediaPlayer(),
 *   enabled: !keyDisabled,
 *   onSeek: (direction, trigger) => seekOneStep(direction, trigger),
 * });
 * ```
 *
 * @category Hooks
 */
export function useSeekKeys({
  player,
  enabled,
  onSeek,
}: {
  player: ElementOwner | null;
  enabled: boolean;
  onSeek: (direction: SeekDirection, trigger: KeyboardEvent) => void;
}): void {
  const reportSeek = useRef(onSeek);

  // In a ref, not in the effect's dependencies: the caller writes this inline,
  // and re-attaching the listeners on every render would do it mid-keystroke.
  useEffect(() => {
    reportSeek.current = onSeek;
  });

  useEffect(() => {
    // Read inside the effect, never during render: the player element is
    // assigned while the tree mounts, and nothing re-renders this hook's
    // caller afterwards to hand it a second chance.
    const playerElement = player?.el;
    if (!enabled || !playerElement) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isSeekKeyOnThePlayer(event, playerElement)) return;
      takeFromTheLibrary(event);
      reportSeek.current(directionOf(event.key), event);
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (isSeekKeyOnThePlayer(event, playerElement)) takeFromTheLibrary(event);
    };

    const keys = playerElement.ownerDocument;
    keys.addEventListener("keydown", onKeyDown, { capture: true });
    keys.addEventListener("keyup", onKeyUp, { capture: true });

    return () => {
      keys.removeEventListener("keydown", onKeyDown, { capture: true });
      keys.removeEventListener("keyup", onKeyUp, { capture: true });
    };
  }, [player, enabled]);
}

/**
 * Whether a key event is a seek, meant for the player rather than for the
 * browser or for a control inside the player.
 */
function isSeekKeyOnThePlayer(event: KeyboardEvent, player: HTMLElement): boolean {
  if (!isSeekKey(event.key) || event.metaKey || event.ctrlKey || event.altKey) return false;
  const focused = player.ownerDocument.activeElement;
  return focused !== null && player.contains(focused) && !focused.matches(SEEK_KEY_OWNERS);
}

function isSeekKey(key: string): boolean {
  return SEEK_KEYS.backward.includes(key) || SEEK_KEYS.forward.includes(key);
}

/** The way a seek key moves the video. Only ever asked about a seek key. */
function directionOf(seekKey: string): SeekDirection {
  return SEEK_KEYS.forward.includes(seekKey) ? "forward" : "backward";
}

function takeFromTheLibrary(event: KeyboardEvent): void {
  event.preventDefault();
  event.stopPropagation();
}
