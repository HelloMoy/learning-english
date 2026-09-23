import type { Database } from "@/adapters/persistence/turso/database/database";
import { earnedTicket } from "@/adapters/persistence/turso/schema/schema";
import { LessonId } from "@/domain/entities/ids/ids";
import type { EarnedTicketRepository } from "@/domain/ports/earned-ticket-repository/earned-ticket-repository";

import { eq } from "drizzle-orm";

/**
 * `EarnedTicketRepository` over the `earned_ticket` table, for one learner.
 *
 * @remarks
 * A batch is one statement that ignores lessons already held, so recording
 * every complete lesson a page knows about costs one round trip however many
 * tickets it already had. Rows that are not lesson ids are left out on read.
 */
export class TursoEarnedTicketRepository implements EarnedTicketRepository {
  constructor(
    private readonly database: Database,
    private readonly learnerId: string,
  ) {}

  async list(): Promise<ReadonlySet<LessonId>> {
    const rows = await this.database
      .select({ lessonId: earnedTicket.lessonId })
      .from(earnedTicket)
      .where(eq(earnedTicket.userId, this.learnerId));
    return new Set(rows.flatMap(({ lessonId }) => parsedLessonId(lessonId)));
  }

  async earn(lessonIds: ReadonlyArray<LessonId>): Promise<void> {
    if (lessonIds.length === 0) return;
    await this.database
      .insert(earnedTicket)
      .values(lessonIds.map((lessonId) => ({ userId: this.learnerId, lessonId })))
      .onConflictDoNothing();
  }
}

function parsedLessonId(value: string): LessonId[] {
  const parsed = LessonId.safeParse(value);
  return parsed.success ? [parsed.data] : [];
}
