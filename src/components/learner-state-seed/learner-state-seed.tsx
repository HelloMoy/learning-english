"use client";

import {
  EMPTY_LEARNER_SNAPSHOT,
  type LearnerSnapshot,
} from "@/lib/learner-snapshot/learner-snapshot";
import { seedLearnerStore } from "@/lib/learner-store/learner-store";

import { useLayoutEffect } from "react";

/**
 * Props for {@link LearnerStateSeed}.
 */
export type LearnerStateSeedProps = {
  /** The signed-in learner's snapshot, or `null` for a visitor without a session. */
  snapshot: LearnerSnapshot | null;
};

/**
 * Hands the server's learner snapshot to the browser's learner store.
 *
 * @remarks
 * Rendered once by the locale layout. It seeds in a layout effect, which runs
 * only in the browser and only after hydration — so every reader still
 * renders its empty server snapshot during hydration, as the progress
 * capabilities require, and switches to the learner's data right after. A new
 * snapshot (after a sign-in or sign-out refresh) is adopted the same way.
 *
 * Renders nothing.
 *
 * @example
 * ```tsx
 * <LearnerStateSeed snapshot={session ? await loadLearnerSnapshot(db, session.user.id) : null} />
 * ```
 */
export function LearnerStateSeed({ snapshot }: LearnerStateSeedProps) {
  useLayoutEffect(() => {
    // A visitor without a session is a known learner with nothing saved.
    seedLearnerStore(snapshot ?? EMPTY_LEARNER_SNAPSHOT);
  }, [snapshot]);

  return null;
}
