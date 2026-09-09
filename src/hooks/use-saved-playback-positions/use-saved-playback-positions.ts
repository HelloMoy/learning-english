"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY_PREFIX = "learning-english:playback:";

/** Shared across every subscriber, so no two surfaces can disagree. */
let snapshot: ReadonlyMap<string, number> = new Map();
const listeners = new Set<() => void>();

/**
 * Stable empty snapshot. `useSyncExternalStore` compares by identity, so
 * returning a fresh `Map` on each server render would loop.
 */
const EMPTY: ReadonlyMap<string, number> = new Map();

function readStorage(): ReadonlyMap<string, number> {
  if (typeof window === "undefined") return EMPTY;
  const positions = new Map<string, number>();
  try {
    for (let index = 0; index < window.localStorage.length; index++) {
      const key = window.localStorage.key(index);
      if (!key?.startsWith(STORAGE_KEY_PREFIX)) continue;
      const seconds = Number.parseFloat(window.localStorage.getItem(key) ?? "");
      if (Number.isFinite(seconds)) {
        positions.set(key.slice(STORAGE_KEY_PREFIX.length), seconds);
      }
    }
  } catch {
    // Storage blocked: behave as if nothing has been watched.
    return EMPTY;
  }
  return positions;
}

/**
 * Re-reads storage and notifies every subscriber.
 *
 * @remarks
 * The `storage` event only fires for writes made by *other* tabs, so the
 * write path in this tab has to say when it has saved something. Exported
 * for that one caller — components read through
 * {@link useSavedPlaybackPositions} and never refresh by hand.
 */
export function refreshSavedPlaybackPositions(): void {
  snapshot = readStorage();
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) snapshot = readStorage();
  listeners.add(listener);
  window.addEventListener("storage", refreshSavedPlaybackPositions);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener("storage", refreshSavedPlaybackPositions);
    }
  };
}

function getSnapshot(): ReadonlyMap<string, number> {
  return snapshot;
}

/**
 * The snapshot the server renders with: always empty.
 *
 * @remarks
 * The server cannot read `localStorage`, so it must render no progress —
 * and the first client render has to agree, or React reports a hydration
 * mismatch on every page carrying an indicator.
 *
 * Exported so the contract is testable rather than implied.
 *
 * @returns A stable empty map
 */
export function savedPlaybackPositionsServerSnapshot(): ReadonlyMap<string, number> {
  return EMPTY;
}

/**
 * Every playback position saved on this device, keyed by lesson id.
 *
 * @remarks
 * The client's composition root for *reading many* positions at once, and
 * the counterpart to `useLessonCompletion`. A list of rows needs a number
 * during render, which is why this is a synchronous snapshot rather than
 * the promise-returning, per-lesson `usePlaybackPosition` — that hook is
 * the player's write path and keeps its shape.
 *
 * One pass over the origin's keys fills the snapshot on the first
 * subscribe; consumers then pay a map lookup each, not a storage call. A
 * position written by another tab arrives through the `storage` event, and
 * one written by this tab through {@link refreshSavedPlaybackPositions}.
 *
 * Values are seconds. An entry whose stored text is not a finite number is
 * dropped rather than surfaced as `NaN`.
 *
 * Browser-side only — do NOT call from a Server Component.
 *
 * @returns A stable map of lesson id to saved seconds; empty before
 *          hydration and whenever storage is unavailable
 *
 * @example
 * ```ts
 * const positions = useSavedPlaybackPositions();
 * const seconds = positions.get(lessonId) ?? null;
 * ```
 */
export function useSavedPlaybackPositions(): ReadonlyMap<string, number> {
  return useSyncExternalStore(subscribe, getSnapshot, savedPlaybackPositionsServerSnapshot);
}
