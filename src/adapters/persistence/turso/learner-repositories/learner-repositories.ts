import type { Database } from "@/adapters/persistence/turso/database/database";
import { TursoContinueWatchingRepository } from "@/adapters/persistence/turso/turso-continue-watching-repository/turso-continue-watching-repository";
import { TursoEarnedTicketRepository } from "@/adapters/persistence/turso/turso-earned-ticket-repository/turso-earned-ticket-repository";
import { TursoLearnerProfileRepository } from "@/adapters/persistence/turso/turso-learner-profile-repository/turso-learner-profile-repository";
import { TursoPlaybackPositionRepository } from "@/adapters/persistence/turso/turso-playback-position-repository/turso-playback-position-repository";
import { TursoPrizeClaimRepository } from "@/adapters/persistence/turso/turso-prize-claim-repository/turso-prize-claim-repository";
import { TursoProgressTracker } from "@/adapters/persistence/turso/turso-progress-tracker/turso-progress-tracker";
import type { ContinueWatchingRepository } from "@/domain/ports/continue-watching-repository/continue-watching-repository";
import type { EarnedTicketRepository } from "@/domain/ports/earned-ticket-repository/earned-ticket-repository";
import type { LearnerProfileRepository } from "@/domain/ports/learner-profile-repository/learner-profile-repository";
import type { PlaybackPositionRepository } from "@/domain/ports/playback-position-repository/playback-position-repository";
import type { PrizeClaimRepository } from "@/domain/ports/prize-claim-repository/prize-claim-repository";
import type { ProgressTracker } from "@/domain/ports/progress-tracker/progress-tracker";

/**
 * One learner's progress and reward ports, all bound to the same learner id.
 *
 * @category Persistence
 */
export type LearnerRepositories = {
  progress: ProgressTracker;
  positions: PlaybackPositionRepository;
  continueWatching: ContinueWatchingRepository;
  profiles: LearnerProfileRepository;
  tickets: EarnedTicketRepository;
  prizeClaims: PrizeClaimRepository;
};

/**
 * Builds every learner-scoped port for one learner — the only place that
 * names the Turso adapters.
 *
 * @remarks
 * The learner id must come from a verified session, never from a request
 * body: this factory trusts it completely.
 *
 * @param database - The database to read and write
 * @param learnerId - The signed-in learner's user id
 * @returns The learner's ports
 */
export function createLearnerRepositories(
  database: Database,
  learnerId: string,
): LearnerRepositories {
  return {
    progress: new TursoProgressTracker(database, learnerId),
    positions: new TursoPlaybackPositionRepository(database, learnerId),
    continueWatching: new TursoContinueWatchingRepository(database, learnerId),
    profiles: new TursoLearnerProfileRepository(database, learnerId),
    tickets: new TursoEarnedTicketRepository(database, learnerId),
    prizeClaims: new TursoPrizeClaimRepository(database, learnerId),
  };
}
