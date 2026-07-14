import type { LessonId } from "@/domain/entities/ids/ids";
import type { ProgressTracker } from "@/domain/ports/progress-tracker/progress-tracker";

/**
 * Driven adapter: in-memory implementation of `ProgressTracker`.
 *
 * Completed lesson ids live in a `Set`. State is **ephemeral** — it does
 * not survive a server restart. When durable persistence arrives, the
 * port contract is unchanged; only this adapter is replaced.
 */
export class InMemoryProgressTracker implements ProgressTracker {
  readonly #completed: Set<LessonId>;

  constructor(initial: Iterable<LessonId> = []) {
    this.#completed = new Set(initial);
  }

  markComplete(lessonId: LessonId): Promise<void> {
    this.#completed.add(lessonId);
    return Promise.resolve();
  }

  isComplete(lessonId: LessonId): Promise<boolean> {
    return Promise.resolve(this.#completed.has(lessonId));
  }
}
