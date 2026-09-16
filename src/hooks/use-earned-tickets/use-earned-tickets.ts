"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY_PREFIX = "learning-english:ticket-earned:";

/** Shared across every subscriber, so no two surfaces can disagree. */
let snapshot: ReadonlySet<string> = new Set();
const listeners = new Set<() => void>();

/**
 * Stable empty snapshot. `useSyncExternalStore` compares by identity, so
 * returning a fresh `Set` on each server render would loop.
 */
const EMPTY: ReadonlySet<string> = new Set();

function readStorage(): ReadonlySet<string> {
  if (typeof window === "undefined") return EMPTY;
  const earned = new Set<string>();
  try {
    for (let index = 0; index < window.localStorage.length; index++) {
      const key = window.localStorage.key(index);
      if (key?.startsWith(STORAGE_KEY_PREFIX)) {
        earned.add(key.slice(STORAGE_KEY_PREFIX.length));
      }
    }
  } catch {
    // Storage blocked: behave as if no ticket had been earned.
    return EMPTY;
  }
  return earned;
}

/**
 * Re-reads storage and notifies every subscriber.
 *
 * @remarks
 * The `storage` event only fires for writes made by *other* tabs, so anything
 * that seeds or clears these keys directly — a test, a reset — has to say so.
 * {@link earnTickets} calls it for its own writes.
 */
export function refreshEarnedTickets(): void {
  snapshot = readStorage();
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) snapshot = readStorage();
  listeners.add(listener);
  // A `storage` event fires when *another* tab writes, so a ticket earned in
  // one tab reaches the others for free.
  window.addEventListener("storage", refreshEarnedTickets);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", refreshEarnedTickets);
  };
}

function getSnapshot(): ReadonlySet<string> {
  return snapshot;
}

/**
 * The snapshot the server renders with: always empty.
 *
 * @remarks
 * The server cannot read `localStorage`, so it must render no tickets — and the
 * first client render has to agree, or React reports a hydration mismatch.
 *
 * @returns A stable empty set
 */
export function earnedTicketsServerSnapshot(): ReadonlySet<string> {
  return EMPTY;
}

/**
 * Every ticket earned on this device, as one snapshot of lesson ids.
 *
 * @remarks
 * A ticket is stored the first time its lesson counts as complete and is kept
 * from then on, which is what lets a learner un-mark a lesson without losing
 * what they earned. Completion itself stays in its own store, so the lesson
 * rows keep telling the truth about where the learner is now.
 *
 * Browser-side only — do NOT call from a Server Component.
 *
 * @returns A stable set of lesson ids; empty before hydration
 */
export function useEarnedTickets(): ReadonlySet<string> {
  return useSyncExternalStore(subscribe, getSnapshot, earnedTicketsServerSnapshot);
}

/**
 * Records a ticket for every lesson that has not earned one yet.
 *
 * @remarks
 * Idempotent and quiet: ids already held are skipped, and when nothing was
 * written no subscriber is notified. Callers can therefore hand it every
 * complete lesson they know about on each render without looping.
 *
 * Deliberately not a hook — the lesson page calls it from an effect when it
 * sees a lesson become complete, and the Achievements page calls it for the
 * lessons that were complete before tickets were stored.
 *
 * @param lessonIds - The lessons whose tickets should be recorded
 */
export function earnTickets(lessonIds: ReadonlyArray<string>): void {
  const unearned = lessonIds.filter((lessonId) => !snapshot.has(lessonId));
  if (unearned.length === 0) return;
  try {
    for (const lessonId of unearned) {
      window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${lessonId}`, "1");
    }
  } catch {
    // Storage blocked: the ticket still shows while the lesson counts as complete.
    return;
  }
  refreshEarnedTickets();
}
