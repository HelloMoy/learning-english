import type { Database } from "@/adapters/persistence/turso/database/database";
import { lessonCompletion } from "@/adapters/persistence/turso/schema/schema";
import type { LessonId } from "@/domain/entities/ids/ids";
import type { ProgressTracker } from "@/domain/ports/progress-tracker/progress-tracker";

import { and, eq } from "drizzle-orm";

/**
 * `ProgressTracker` over the `lesson_completion` table, for one learner.
 *
 * @remarks
 * A row is the mark; its absence is "not complete". Both writers are
 * idempotent, as the port requires: marking ignores an existing row, and
 * un-marking a lesson that was never marked deletes nothing.
 *
 * @example
 * ```ts
 * const progress = new TursoProgressTracker(database, session.user.id);
 * await progress.markComplete(lessonId);
 * ```
 */
export class TursoProgressTracker implements ProgressTracker {
  constructor(
    private readonly database: Database,
    private readonly learnerId: string,
  ) {}

  async markComplete(lessonId: LessonId): Promise<void> {
    await this.database
      .insert(lessonCompletion)
      .values({ userId: this.learnerId, lessonId })
      .onConflictDoNothing();
  }

  async unmarkComplete(lessonId: LessonId): Promise<void> {
    await this.database.delete(lessonCompletion).where(this.#rowOf(lessonId));
  }

  async isComplete(lessonId: LessonId): Promise<boolean> {
    return (await this.database.$count(lessonCompletion, this.#rowOf(lessonId))) > 0;
  }

  #rowOf(lessonId: LessonId) {
    return and(
      eq(lessonCompletion.userId, this.learnerId),
      eq(lessonCompletion.lessonId, lessonId),
    );
  }
}
