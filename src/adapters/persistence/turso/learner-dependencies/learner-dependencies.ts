import "server-only";

import { getCoursePlatformDeps } from "@/adapters/persistence/in-memory/use-case-dependencies/use-case-dependencies";
import { getDatabase } from "@/adapters/persistence/turso/database/database";
import {
  createLearnerRepositories,
  type LearnerRepositories,
} from "@/adapters/persistence/turso/learner-repositories/learner-repositories";
import { makeMarkLessonComplete } from "@/domain/use-cases/mark-lesson-complete/mark-lesson-complete";
import { makeRecordPlaybackPosition } from "@/domain/use-cases/record-playback-position/record-playback-position";
import { makeSaveLearnerProfile } from "@/domain/use-cases/save-learner-profile/save-learner-profile";
import { makeUnmarkLessonComplete } from "@/domain/use-cases/unmark-lesson-complete/unmark-lesson-complete";

/**
 * One learner's ports and the use cases that write through them.
 *
 * @category Persistence
 */
export type LearnerDependencies = {
  repositories: LearnerRepositories;
  useCases: {
    markLessonComplete: ReturnType<typeof makeMarkLessonComplete>;
    unmarkLessonComplete: ReturnType<typeof makeUnmarkLessonComplete>;
    recordPlaybackPosition: ReturnType<typeof makeRecordPlaybackPosition>;
    saveLearnerProfile: ReturnType<typeof makeSaveLearnerProfile>;
  };
};

/**
 * The server's composition root for one learner: the Turso ports bound to
 * that learner, composed with the catalog into the use cases the learner
 * actions and the playback beacon run.
 *
 * @param learnerId - The signed-in learner's id, from a verified session only
 * @returns The learner's repositories and use cases
 */
export function getLearnerDependencies(learnerId: string): LearnerDependencies {
  const repositories = createLearnerRepositories(getDatabase(), learnerId);
  const { lessons } = getCoursePlatformDeps();

  return {
    repositories,
    useCases: {
      markLessonComplete: makeMarkLessonComplete({ lessons, progress: repositories.progress }),
      unmarkLessonComplete: makeUnmarkLessonComplete({ lessons, progress: repositories.progress }),
      recordPlaybackPosition: makeRecordPlaybackPosition({
        lessons,
        positions: repositories.positions,
      }),
      saveLearnerProfile: makeSaveLearnerProfile({ profiles: repositories.profiles }),
    },
  };
}
