import type { LessonId } from "@/domain/entities/ids/ids";
import type { ProgressTracker } from "@/domain/ports/progress-tracker/progress-tracker";
import { learnerStore, writeThrough } from "@/lib/learner-store/learner-store";

/**
 * The server calls a {@link LearnerStoreProgressTracker} writes through; each
 * resolves whether the server accepted the change.
 *
 * @category Learner state
 */
export type CompletionRequests = {
  mark: (lessonId: LessonId) => Promise<boolean>;
  unmark: (lessonId: LessonId) => Promise<boolean>;
};

/**
 * The browser's `ProgressTracker`: reads the learner store, writes through
 * the completion Server Actions.
 *
 * @remarks
 * Writes are optimistic — the mark appears at once — and a refused or failed
 * request puts it back as it was. The requests are injected so this adapter
 * never imports a `"use server"` module and can be tested with plain fakes.
 *
 * @example
 * ```ts
 * const tracker = new LearnerStoreProgressTracker({
 *   mark: async (lessonId) => (await markLessonCompleteAction({ lessonId }))?.data?.completed === true,
 *   unmark: async (lessonId) => (await unmarkLessonCompleteAction({ lessonId }))?.data?.unmarked === true,
 * });
 * ```
 */
export class LearnerStoreProgressTracker implements ProgressTracker {
  constructor(private readonly requests: CompletionRequests) {}

  async markComplete(lessonId: LessonId): Promise<void> {
    await writeThrough(
      ({ completed }) => ({ completed: new Set(completed).add(lessonId) }),
      () => this.requests.mark(lessonId),
    );
  }

  async unmarkComplete(lessonId: LessonId): Promise<void> {
    await writeThrough(
      ({ completed }) => ({ completed: withoutLesson(completed, lessonId) }),
      () => this.requests.unmark(lessonId),
    );
  }

  async isComplete(lessonId: LessonId): Promise<boolean> {
    return learnerStore.getState().completed.has(lessonId);
  }
}

function withoutLesson(completed: ReadonlySet<string>, lessonId: LessonId): ReadonlySet<string> {
  const remaining = new Set(completed);
  remaining.delete(lessonId);
  return remaining;
}
