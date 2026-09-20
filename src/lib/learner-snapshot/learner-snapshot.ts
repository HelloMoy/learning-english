import type { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import type { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";

/**
 * Everything the client needs to know about the signed-in learner, loaded
 * once per request by the locale layout and handed to the browser.
 *
 * @remarks
 * Plain, serializable data — it crosses the server/client boundary as a prop.
 * Sets and maps become arrays and records here and are rebuilt by the client
 * store.
 *
 * @category Learner state
 */
export type LearnerSnapshot = {
  profile: LearnerProfile | null;
  completedLessonIds: ReadonlyArray<string>;
  positions: Readonly<Record<string, number>>;
  continueWatching: ContinueWatchingLocation | null;
  earnedTicketLessonIds: ReadonlyArray<string>;
  claimedPrizeModuleSlugs: ReadonlyArray<string>;
};

/**
 * The snapshot of a learner with no progress at all.
 *
 * @category Learner state
 */
export const EMPTY_LEARNER_SNAPSHOT: LearnerSnapshot = {
  profile: null,
  completedLessonIds: [],
  positions: {},
  continueWatching: null,
  earnedTicketLessonIds: [],
  claimedPrizeModuleSlugs: [],
};
