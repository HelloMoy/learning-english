import type { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import type { LearnerProfileRepository } from "@/domain/ports/learner-profile-repository/learner-profile-repository";
import { ResultAsync } from "@/domain/result/result";

import type { FindLearnerProfileErrors } from "./find-learner-profile.errors";

export type FindLearnerProfile = () => ResultAsync<LearnerProfile | null, FindLearnerProfileErrors>;

const toInternalError = (cause: unknown): FindLearnerProfileErrors => ({
  kind: "internal-error",
  cause,
});

/**
 * Use case: read the learner profile this device holds.
 *
 * Resolves to `null` for a device that has not onboarded yet.
 */
export const makeFindLearnerProfile = (deps: {
  profiles: LearnerProfileRepository;
}): FindLearnerProfile => {
  return () => ResultAsync.fromPromise(deps.profiles.get(), toInternalError);
};
