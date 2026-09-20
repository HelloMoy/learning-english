import type { Database } from "@/adapters/persistence/turso/database/database";
import { continueWatching } from "@/adapters/persistence/turso/schema/schema";
import { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import type { ContinueWatchingRepository } from "@/domain/ports/continue-watching-repository/continue-watching-repository";

import { eq } from "drizzle-orm";

/**
 * `ContinueWatchingRepository` over the `continue_watching` table: one row per
 * learner, replaced by every `set`.
 *
 * @remarks
 * A stored row is parsed through `ContinueWatchingLocation` on the way out; one
 * that no longer satisfies it reads as absent, which is what the port says
 * about a record it cannot use.
 */
export class TursoContinueWatchingRepository implements ContinueWatchingRepository {
  constructor(
    private readonly database: Database,
    private readonly learnerId: string,
  ) {}

  async get(): Promise<ContinueWatchingLocation | null> {
    const [row] = await this.database
      .select({
        courseSlug: continueWatching.courseSlug,
        moduleSlug: continueWatching.moduleSlug,
        lessonId: continueWatching.lessonId,
      })
      .from(continueWatching)
      .where(eq(continueWatching.userId, this.learnerId));
    const parsed = ContinueWatchingLocation.safeParse(row);
    return parsed.success ? parsed.data : null;
  }

  async set(location: ContinueWatchingLocation): Promise<void> {
    await this.database
      .insert(continueWatching)
      .values({ userId: this.learnerId, ...location })
      .onConflictDoUpdate({
        target: continueWatching.userId,
        set: { ...location, updatedAt: new Date() },
      });
  }
}
