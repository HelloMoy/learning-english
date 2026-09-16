"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY_PREFIX = "learning-english:prize-claimed:";

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
  const claimed = new Set<string>();
  try {
    for (let index = 0; index < window.localStorage.length; index++) {
      const key = window.localStorage.key(index);
      if (key?.startsWith(STORAGE_KEY_PREFIX)) {
        claimed.add(key.slice(STORAGE_KEY_PREFIX.length));
      }
    }
  } catch {
    // Storage blocked: behave as if no prize had been claimed.
    return EMPTY;
  }
  return claimed;
}

/**
 * Re-reads storage and notifies every subscriber.
 *
 * @remarks
 * The `storage` event only fires for writes made by *other* tabs, so anything
 * that seeds or clears these keys directly — a test, a reset — has to say so.
 * {@link claimPrize} calls it for its own writes.
 */
export function refreshPrizeClaims(): void {
  snapshot = readStorage();
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) snapshot = readStorage();
  listeners.add(listener);
  // A `storage` event fires when *another* tab writes, so a prize claimed in
  // one tab reaches the others for free.
  window.addEventListener("storage", refreshPrizeClaims);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", refreshPrizeClaims);
  };
}

function getSnapshot(): ReadonlySet<string> {
  return snapshot;
}

/**
 * The snapshot the server renders with: always empty.
 *
 * @remarks
 * The server cannot read `localStorage`, so it must render no claims — and the
 * first client render has to agree, or React reports a hydration mismatch.
 *
 * @returns A stable empty set
 */
export function claimedPrizesServerSnapshot(): ReadonlySet<string> {
  return EMPTY;
}

/**
 * Every prize claimed on this device, as one snapshot of module slugs.
 *
 * @remarks
 * Claiming is an act, not a consequence of completion, so it is the one thing
 * about a prize that has to be stored. A claimed prize stays claimed: the
 * tickets were exchanged for it.
 *
 * Module slugs rather than ids, for the reason the prize catalog uses them —
 * they are stable, readable in devtools, and already the prize's identity.
 *
 * Browser-side only — do NOT call from a Server Component.
 *
 * @returns A stable set of module slugs; empty before hydration
 */
export function useClaimedPrizes(): ReadonlySet<string> {
  return useSyncExternalStore(subscribe, getSnapshot, claimedPrizesServerSnapshot);
}

/**
 * Records that the learner claimed a module's prize, and tells every surface.
 *
 * @remarks
 * Idempotent: claiming an already claimed prize writes nothing and notifies no
 * one. The counter calls it the moment the control is activated, before the
 * reveal plays, so closing the dialog early still leaves the prize claimed.
 *
 * @param moduleSlug - The module whose prize was claimed
 */
export function claimPrize(moduleSlug: string): void {
  if (snapshot.has(moduleSlug)) return;
  try {
    window.localStorage.setItem(`${STORAGE_KEY_PREFIX}${moduleSlug}`, "1");
  } catch {
    // Storage blocked: the prize stays ready to claim rather than claimed.
    return;
  }
  refreshPrizeClaims();
}
