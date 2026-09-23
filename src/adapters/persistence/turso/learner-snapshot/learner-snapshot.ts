import type { Database } from "@/adapters/persistence/turso/database/database";
import { createLearnerRepositories } from "@/adapters/persistence/turso/learner-repositories/learner-repositories";
import { lessonCompletion, playbackPosition } from "@/adapters/persistence/turso/schema/schema";
import type { LearnerSnapshot } from "@/lib/learner-snapshot/learner-snapshot";

import { eq } from "drizzle-orm";

/**
 * Reads everything the client needs about one learner, in one step.
 *
 * @remarks
 * Completion and positions are read as whole tables — the ports answer one
 * lesson at a time, which is right for a use case and wrong for a snapshot of
 * a 150-lesson catalog. The profile and the location go through their ports,
 * so their parsing rules stay in one place.
 *
 * @param database - The database to read
 * @param learnerId - The signed-in learner's user id
 * @returns The learner's snapshot; empty collections when there is no progress
 */
export async function loadLearnerSnapshot(
  database: Database,
  learnerId: string,
): Promise<LearnerSnapshot> {
  const repositories = createLearnerRepositories(database, learnerId);
  const [profile, continueWatching, tickets, prizeClaims, completions, positions] =
    await Promise.all([
      repositories.profiles.get(),
      repositories.continueWatching.get(),
      repositories.tickets.list(),
      repositories.prizeClaims.list(),
      database
        .select({ lessonId: lessonCompletion.lessonId })
        .from(lessonCompletion)
        .where(eq(lessonCompletion.userId, learnerId)),
      database
        .select({ lessonId: playbackPosition.lessonId, seconds: playbackPosition.seconds })
        .from(playbackPosition)
        .where(eq(playbackPosition.userId, learnerId)),
    ]);

  return {
    profile,
    completedLessonIds: completions.map((row) => row.lessonId),
    positions: Object.fromEntries(positions.map((row) => [row.lessonId, row.seconds])),
    continueWatching,
    earnedTicketLessonIds: [...tickets],
    claimedPrizeModuleSlugs: [...prizeClaims],
  };
}
