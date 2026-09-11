"use client";

import {
  DEFAULT_SEEK_STEP_SECONDS,
  parseSeekStepSeconds,
  type SeekStepSeconds,
} from "@/lib/seek-run/seek-run";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Where the learner's seek step lives in the browser.
 *
 * @remarks
 * Prefixed like every other key this app writes
 * (`learning-english:playback:…`, `learning-english:continue-watching`), so a
 * glance at DevTools groups them and another app on the origin cannot collide.
 *
 * @category Hooks
 */
export const SEEK_STEP_STORAGE_KEY = "learning-english:seek-step";

/** Every mounted consumer, so a choice made in one reaches all of them. */
const subscribers = new Set<() => void>();

function notifySubscribers(): void {
  for (const notify of subscribers) notify();
}

/**
 * Module-level and stable, so React never tears the subscription down and
 * builds it again on a re-render — a resubscribe mid-teardown is what made
 * Vidstack's gestures read props of an instance it had already destroyed.
 */
function subscribe(onStoreChange: () => void): () => void {
  subscribers.add(onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    subscribers.delete(onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

/**
 * The browser's own storage, unless a caller injected one.
 *
 * @remarks
 * Reading `window.localStorage` can itself throw in a browser configured to
 * block site data, which is why even the lookup is guarded.
 */
function resolveStorage(injected?: Storage): Storage | undefined {
  if (injected !== undefined) return injected;
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

function readStoredStep(storage: Storage | undefined): SeekStepSeconds {
  try {
    return parseSeekStepSeconds(storage?.getItem(SEEK_STEP_STORAGE_KEY) ?? null);
  } catch {
    return DEFAULT_SEEK_STEP_SECONDS;
  }
}

function writeStoredStep(storage: Storage | undefined, seconds: SeekStepSeconds): void {
  try {
    storage?.setItem(SEEK_STEP_STORAGE_KEY, String(seconds));
  } catch {
    // A browser that refuses to remember the preference still has to play the
    // lesson. The step stays whatever this session is already using.
  }
}

/** The server has no storage to read, so it renders what a new learner gets. */
function defaultStep(): SeekStepSeconds {
  return DEFAULT_SEEK_STEP_SECONDS;
}

/**
 * Client hook: the seek step the learner chose, and the way to change it.
 *
 * @remarks
 * How far a double tap on the video skips is a **preference of the player's
 * chrome**, not learner data. That is why it is stored here rather than behind
 * a domain port the way playback position, continue-watching and completion
 * are: no use case reasons about it, and the domain would gain an interface
 * nothing in the domain calls. What it does keep from those adapters is the
 * `learning-english:` key namespace and the rule that storage which is absent,
 * denied or corrupt degrades to the default instead of throwing.
 *
 * Two consumers in one tree need the same answer — `PlaybackGestures` and
 * `SeekStepMenu` — and a second tab can change it underneath both. A
 * module-level subscriber set plus `useSyncExternalStore` serves all three
 * without a context provider: a write notifies the subscribers directly (the
 * `storage` event does not fire in the tab that wrote), and the event covers
 * the other tabs.
 *
 * `getServerSnapshot` returns the default, so the server's HTML and the
 * hydration render agree by construction; React compares the two snapshots
 * once hydration commits and re-renders with the stored one itself, which is
 * why nothing here has to nudge it. For that one commit the step is the
 * default even for a learner who chose ten seconds; no gesture can land in
 * it, and the menu reads the same store, so it can never show a step the
 * gestures do not have.
 *
 * @param storage - Overrides the browser's `localStorage`; tests inject a fake
 *                  here instead of monkey-patching the global
 * @returns The step in force, in seconds, and `choose` to change it
 *
 * @category Hooks
 */
export function useSeekStep(storage?: Storage): {
  stepSeconds: SeekStepSeconds;
  choose: (seconds: SeekStepSeconds) => void;
} {
  const resolved = resolveStorage(storage);

  const stepSeconds = useSyncExternalStore(
    subscribe,
    useCallback(() => readStoredStep(resolved), [resolved]),
    defaultStep,
  );

  const choose = useCallback(
    (seconds: SeekStepSeconds) => {
      writeStoredStep(resolved, seconds);
      notifySubscribers();
    },
    [resolved],
  );

  return { stepSeconds, choose };
}
