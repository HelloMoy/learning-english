"use client";

import { learnerStore } from "@/lib/learner-store/learner-store";

import { useSyncExternalStore } from "react";

const isSeeded = () => learnerStore.getState().isSeeded;
const notSeededOnTheServer = () => false;

/**
 * Client hook: reports whether the learner store has been seeded with this
 * learner's state.
 *
 * @remarks
 * Enrollments, completion marks and the rest of the learner's state reach the
 * browser after the page renders, so anything that reads them would first show
 * an empty learner — **Enroll** to someone already enrolled, for one. Gate that
 * markup on this hook and render a neutral shape until it turns `true`.
 *
 * Always `false` on the server.
 *
 * @example
 * ```tsx
 * const isSeeded = useIsLearnerStoreSeeded();
 * if (!isSeeded) return <PendingCoursePage title={title} />;
 * ```
 *
 * @returns `false` until the learner store is seeded, `true` afterwards
 */
export function useIsLearnerStoreSeeded(): boolean {
  return useSyncExternalStore(learnerStore.subscribe, isSeeded, notSeededOnTheServer);
}
