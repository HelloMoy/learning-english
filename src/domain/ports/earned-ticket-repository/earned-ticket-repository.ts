import type { LessonId } from "@/domain/entities/ids/ids";

/**
 * Port: the tickets a learner has earned, one per lesson.
 *
 * A ticket is earned the first time its lesson counts as complete and is kept
 * from then on — un-marking the lesson never takes it back (capability
 * `learner-achievements`). So the port can only add: `earn` records a batch,
 * skipping lessons already held, and there is no way to remove one.
 *
 * `earn` takes a batch because tickets are recorded for every complete lesson
 * a page knows about at once, such as the Achievements page catching up on
 * lessons completed before tickets were stored.
 */
export interface EarnedTicketRepository {
  /** Every lesson whose ticket has been earned. */
  list(): Promise<ReadonlySet<LessonId>>;

  /** Records a ticket for each lesson; idempotent per lesson. */
  earn(lessonIds: ReadonlyArray<LessonId>): Promise<void>;
}
