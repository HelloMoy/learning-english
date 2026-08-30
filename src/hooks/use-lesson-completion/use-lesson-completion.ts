"use client";

import { BrowserLocalStorageProgressTracker } from "@/adapters/persistence/browser-local-storage/browser-local-storage-progress-tracker/browser-local-storage-progress-tracker";
import type { LessonId } from "@/domain/entities/ids/ids";

import { useSyncExternalStore } from "react";

const STORAGE_KEY_PREFIX = "learning-english:completed:";

/**
 * The client's composition root for completion — the one module allowed to
 * name the concrete adapter, mirroring the role `usePlaybackPosition` plays
 * for playback and `getCoursePlatformDeps` plays on the server.
 */
const tracker = new BrowserLocalStorageProgressTracker();

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
  const completed = new Set<string>();
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(STORAGE_KEY_PREFIX)) {
        completed.add(key.slice(STORAGE_KEY_PREFIX.length));
      }
    }
  } catch {
    // Storage blocked: behave as if nothing is complete.
  }
  return completed;
}

function refresh(): void {
  snapshot = readStorage();
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) snapshot = readStorage();
  listeners.add(listener);
  // A `storage` event fires when *another* tab writes, so completing a
  // lesson in one tab is reflected in the others for free.
  window.addEventListener("storage", refresh);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", refresh);
  };
}

function getSnapshot(): ReadonlySet<string> {
  return snapshot;
}

/**
 * The snapshot the server renders with: always empty.
 *
 * @remarks
 * The server cannot read `localStorage`, so it must render no completion
 * marks — and the first client render has to agree, or React reports a
 * hydration mismatch on every page carrying an indicator.
 *
 * Exported so the contract is testable rather than implied.
 *
 * @returns A stable empty set
 */
export function serverCompletionSnapshot(): ReadonlySet<string> {
  return EMPTY;
}

/**
 * Whether a lesson has been completed on this device.
 *
 * @remarks
 * Reads through a module-level store rather than per-component state, so
 * every surface showing completion shares one snapshot: a lesson marked
 * while the outline and an episode row are both mounted updates both,
 * with no reload.
 *
 * Marks appear only after hydration, because storage is a browser fact the
 * server cannot see. That is why the indicator must express *completed*
 * and never "not completed" — the pre-hydration frame omits information
 * rather than asserting something false about the learner's progress.
 *
 * Browser-side only — do NOT call from a Server Component.
 *
 * @param lessonId - The lesson to check
 * @returns `true` once storage reports the lesson complete
 */
export function useLessonCompletion(lessonId: LessonId): boolean {
  const completed = useSyncExternalStore(subscribe, getSnapshot, serverCompletionSnapshot);
  return completed.has(lessonId);
}

/**
 * Marks a lesson complete and notifies every subscriber.
 *
 * @remarks
 * Writes through the `ProgressTracker` port, never `window.localStorage`
 * directly. Deliberately not a hook: the Mark-as-complete button calls it
 * from inside a transition, and the indicators observe the result through
 * {@link useLessonCompletion}.
 *
 * @param lessonId - The lesson to mark
 */
export async function markLessonComplete(lessonId: LessonId): Promise<void> {
  await tracker.markComplete(lessonId);
  refresh();
}
