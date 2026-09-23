"use client";

import { LearnerStoreProgressTracker } from "@/adapters/persistence/learner-store/learner-store-progress-tracker/learner-store-progress-tracker";
import {
  markLessonCompleteAction,
  unmarkLessonCompleteAction,
} from "@/app/[locale]/learner-actions";
import type { LessonId } from "@/domain/entities/ids/ids";
import { learnerStore } from "@/lib/learner-store/learner-store";

import { useSyncExternalStore } from "react";

/**
 * The client's composition root for completion — the one module allowed to
 * name the concrete adapter and the completion Server Actions, mirroring the
 * role `usePlaybackPosition` plays for playback and the learner dependencies
 * play on the server.
 */
const tracker = new LearnerStoreProgressTracker({
  mark: async (lessonId) =>
    (await markLessonCompleteAction({ lessonId }))?.data?.completed === true,
  unmark: async (lessonId) =>
    (await unmarkLessonCompleteAction({ lessonId }))?.data?.unmarked === true,
});

/**
 * Stable empty snapshot. `useSyncExternalStore` compares by identity, so
 * returning a fresh `Set` on each server render would loop.
 */
const EMPTY: ReadonlySet<string> = new Set();

function completedLessons(): ReadonlySet<string> {
  return learnerStore.getState().completed;
}

/**
 * The snapshot the server renders with: always empty.
 *
 * @remarks
 * The server renders no completion marks, and the first client render has to
 * agree, or React reports a hydration mismatch on every page carrying an
 * indicator. The learner's marks arrive right after hydration, when the
 * learner store is seeded.
 *
 * Exported so the contract is testable rather than implied.
 *
 * @returns A stable empty set
 */
export function serverCompletionSnapshot(): ReadonlySet<string> {
  return EMPTY;
}

/**
 * Every lesson the signed-in learner has completed, as one snapshot.
 *
 * @remarks
 * The shape a *count* needs. {@link useLessonCompletion} answers for one
 * lesson, which is right for an indicator and wrong for a module meter that
 * must ask about seventeen at once — and a hook call per lesson would break
 * the rules of hooks the moment a module is reordered.
 *
 * Browser-side only — do NOT call from a Server Component.
 *
 * @returns A stable set of completed lesson ids; empty before hydration
 */
export function useCompletedLessons(): ReadonlySet<string> {
  return useSyncExternalStore(learnerStore.subscribe, completedLessons, serverCompletionSnapshot);
}

/**
 * Whether the signed-in learner has completed a lesson.
 *
 * @remarks
 * Reads through the shared learner store rather than per-component state, so
 * every surface showing completion agrees: a lesson marked while the outline
 * and a video row are both mounted updates both, with no reload.
 *
 * Marks appear only after hydration. That is why the indicator must express
 * *completed* and never "not completed" — the pre-hydration frame omits
 * information rather than asserting something false about the learner's
 * progress.
 *
 * Browser-side only — do NOT call from a Server Component.
 *
 * @param lessonId - The lesson to check
 * @returns `true` once the learner's state reports the lesson complete
 */
export function useLessonCompletion(lessonId: LessonId): boolean {
  return useCompletedLessons().has(lessonId);
}

/**
 * Marks a lesson complete for the signed-in learner.
 *
 * @remarks
 * The mark shows at once on every surface and is saved through the
 * completion Server Action; a refused save withdraws it. Deliberately not a
 * hook: the Mark-as-complete button calls it from inside a transition, and
 * the indicators observe the result through {@link useLessonCompletion}.
 *
 * @param lessonId - The lesson to mark
 * @returns Whether the mark was saved
 */
export async function markLessonComplete(lessonId: LessonId): Promise<boolean> {
  await tracker.markComplete(lessonId);
  return tracker.isComplete(lessonId);
}

/**
 * Clears a lesson's completion for the signed-in learner.
 *
 * @remarks
 * The learner's own undo of {@link markLessonComplete}, and the only thing
 * that clears a mark — playback never does. Writes through the same tracker,
 * so the outline, the lesson rows and the progress meters stop showing the
 * lesson as complete without a reload; a refused save puts the mark back.
 *
 * Deliberately not a hook: the completion toggle calls it from inside a
 * transition, once the learner has confirmed.
 *
 * @param lessonId - The lesson to un-mark
 * @returns Whether the un-mark was saved
 */
export async function unmarkLessonComplete(lessonId: LessonId): Promise<boolean> {
  await tracker.unmarkComplete(lessonId);
  return !(await tracker.isComplete(lessonId));
}
