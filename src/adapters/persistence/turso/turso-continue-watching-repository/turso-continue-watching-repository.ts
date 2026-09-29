import type { Database } from "@/adapters/persistence/turso/database/database";
import { continueWatching } from "@/adapters/persistence/turso/schema/schema";
import type { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import { ContinueWatchingRecord } from "@/domain/entities/continue-watching-record/continue-watching-record";
import type { ContinueWatchingRepository } from "@/domain/ports/continue-watching-repository/continue-watching-repository";

import { desc, eq, sql } from "drizzle-orm";

// The database's clock, like the column default: adapters never stamp rows.
const NOW_MS = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

/**
 * `ContinueWatchingRepository` over the `continue_watching` table: one row per
 * learner and course, ordered by `updated_at`.
 *
 * @remarks
 * Stored rows are parsed through `ContinueWatchingRecord` on the way out; one
 * that no longer satisfies it is skipped, which is what the port says about a
 * record it cannot use.
 */
export class TursoContinueWatchingRepository implements ContinueWatchingRepository {
  constructor(
    private readonly database: Database,
    private readonly learnerId: string,
  ) {}

  async get(): Promise<ContinueWatchingLocation | null> {
    const [latest] = await this.list();
    return latest?.location ?? null;
  }

  async set(location: ContinueWatchingLocation): Promise<void> {
    await this.database
      .insert(continueWatching)
      .values({ userId: this.learnerId, ...location })
      .onConflictDoUpdate({
        target: [continueWatching.userId, continueWatching.courseSlug],
        set: { moduleSlug: location.moduleSlug, lessonId: location.lessonId, updatedAt: NOW_MS },
      });
  }

  async list(): Promise<ReadonlyArray<ContinueWatchingRecord>> {
    const rows = await this.database
      .select()
      .from(continueWatching)
      .where(eq(continueWatching.userId, this.learnerId))
      .orderBy(desc(continueWatching.updatedAt));
    return rows.flatMap(({ courseSlug, moduleSlug, lessonId, updatedAt }) =>
      parsedRecord({
        location: { courseSlug, moduleSlug, lessonId },
        watchedAt: updatedAt.getTime(),
      }),
    );
  }
}

function parsedRecord(value: unknown): ContinueWatchingRecord[] {
  const parsed = ContinueWatchingRecord.safeParse(value);
  return parsed.success ? [parsed.data] : [];
}
