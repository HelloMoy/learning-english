"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "learning-english:prize-announce";

/** Shared across every subscriber, so no two surfaces can disagree. */
let snapshot: string | null = null;
const listeners = new Set<() => void>();

function readStorage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage blocked: nothing is waiting to be announced.
    return null;
  }
}

/**
 * Re-reads storage and notifies every subscriber.
 *
 * @remarks
 * The `storage` event only fires for writes made by *other* tabs, so anything
 * that seeds or clears this key directly — a test, a reset — has to say so.
 * {@link announcePrize} and {@link clearPendingPrize} call it for their own
 * writes.
 */
export function refreshPendingPrizeAnnouncement(): void {
  snapshot = readStorage();
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) snapshot = readStorage();
  listeners.add(listener);
  window.addEventListener("storage", refreshPendingPrizeAnnouncement);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener("storage", refreshPendingPrizeAnnouncement);
    }
  };
}

function getSnapshot(): string | null {
  return snapshot;
}

/**
 * The snapshot the server renders with: nothing pending.
 *
 * @remarks
 * The server cannot read `localStorage`, and the first client render has to
 * agree or React reports a hydration mismatch.
 *
 * @returns `null`
 */
export function pendingPrizeServerSnapshot(): string | null {
  return null;
}

/**
 * The module whose prize is waiting to be announced, if any.
 *
 * @remarks
 * Collecting a module's last ticket opens a dialog a few seconds later, once
 * the ticket notification has left — and a learner who moves on in those
 * seconds unmounts the page that owed them the dialog. Recording the prize here
 * lets the announcement outlive that page and be made wherever they land.
 *
 * Browser-side only — do NOT call from a Server Component.
 *
 * @returns The module slug waiting to be announced, or `null`
 */
export function usePendingPrizeAnnouncement(): string | null {
  return useSyncExternalStore(subscribe, getSnapshot, pendingPrizeServerSnapshot);
}

/**
 * Records that a module's prize is waiting to be announced.
 *
 * @remarks
 * Called the moment the last ticket is earned, not when the dialog is due, so
 * leaving mid-notification cannot lose it. A second prize replaces the first:
 * the announcement names the prize just earned.
 *
 * @param moduleSlug - The module whose prize is now waiting
 */
export function announcePrize(moduleSlug: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, moduleSlug);
  } catch {
    // Storage blocked: the prize still waits on the counter.
    return;
  }
  refreshPendingPrizeAnnouncement();
}

/** How many surfaces are currently making the announcement themselves. */
let holders = 0;
const holdListeners = new Set<() => void>();

function notifyHold(): void {
  for (const listener of holdListeners) listener();
}

function subscribeHold(listener: () => void): () => void {
  holdListeners.add(listener);
  return () => {
    holdListeners.delete(listener);
  };
}

function isHeldSnapshot(): boolean {
  return holders > 0;
}

function isHeldServerSnapshot(): boolean {
  return false;
}

/**
 * Claims the announcement for the surface that won the prize.
 *
 * @remarks
 * The lesson page plays the ticket first and opens the dialog itself a few
 * seconds later. It records the prize the instant it is won, so without this
 * every other surface would see that record and announce it immediately — over
 * the ticket the news belongs to.
 *
 * The hold is a live fact about this browsing session, not a stored one: it
 * lives only as long as the page that took it, so a learner who leaves
 * mid-ticket frees it and is told on the page they open next.
 *
 * @returns Releases the hold; calling it more than once does nothing
 */
export function holdPrizeAnnouncement(): () => void {
  holders += 1;
  notifyHold();

  let hasReleased = false;
  return () => {
    if (hasReleased) return;
    hasReleased = true;
    holders -= 1;
    notifyHold();
  };
}

/**
 * Whether some surface is making the announcement itself right now.
 *
 * @remarks
 * Browser-side only — do NOT call from a Server Component.
 *
 * @returns `true` while a hold is out
 */
export function useIsPrizeAnnouncementHeld(): boolean {
  return useSyncExternalStore(subscribeHold, isHeldSnapshot, isHeldServerSnapshot);
}

/**
 * Drops the pending announcement, once it has been made or has become moot.
 *
 * @remarks
 * Showing the dialog spends it, and so does claiming that prize — a learner who
 * went straight to the counter has already been told by the counter itself.
 */
export function clearPendingPrize(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked: there was nothing to clear.
    return;
  }
  refreshPendingPrizeAnnouncement();
}
