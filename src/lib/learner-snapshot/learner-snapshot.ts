import type { ContinueWatchingRecord } from "@/domain/entities/continue-watching-record/continue-watching-record";
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
  /** One record per course the learner has opened, the most recently watched first. */
  continueWatching: ReadonlyArray<ContinueWatchingRecord>;
  earnedTicketLessonIds: ReadonlyArray<string>;
  claimedPrizeModuleSlugs: ReadonlyArray<string>;
  enrolledCourseSlugs: ReadonlyArray<string>;
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
  continueWatching: [],
  earnedTicketLessonIds: [],
  claimedPrizeModuleSlugs: [],
  enrolledCourseSlugs: [],
};
