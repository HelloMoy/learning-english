import type { LessonId } from "@/domain/entities/ids/ids";
import type { EarnedTicketRepository } from "@/domain/ports/earned-ticket-repository/earned-ticket-repository";

/**
 * In-memory `EarnedTicketRepository`, for use-case tests and stories.
 */
export class InMemoryEarnedTicketRepository implements EarnedTicketRepository {
  readonly #earned: Set<LessonId>;

  constructor(initial: Iterable<LessonId> = []) {
    this.#earned = new Set(initial);
  }

  list(): Promise<ReadonlySet<LessonId>> {
    return Promise.resolve(new Set(this.#earned));
  }

  earn(lessonIds: ReadonlyArray<LessonId>): Promise<void> {
    for (const lessonId of lessonIds) this.#earned.add(lessonId);
    return Promise.resolve();
  }
}
