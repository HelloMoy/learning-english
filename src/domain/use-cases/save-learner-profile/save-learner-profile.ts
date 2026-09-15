import { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import type { LearnerProfileRepository } from "@/domain/ports/learner-profile-repository/learner-profile-repository";
import { err, ok, Result, ResultAsync } from "@/domain/result/result";

import type { SaveLearnerProfileErrors } from "./save-learner-profile.errors";

export type SaveLearnerProfile = (
  input: unknown,
) => ResultAsync<LearnerProfile, SaveLearnerProfileErrors>;

const toInternalError = (cause: unknown): SaveLearnerProfileErrors => ({
  kind: "internal-error",
  cause,
});

const parseProfile = (input: unknown): Result<LearnerProfile, SaveLearnerProfileErrors> => {
  const parsed = LearnerProfile.safeParse(input);
  return parsed.success ? ok(parsed.data) : err({ kind: "invalid-learner-profile" });
};

/**
 * Use case: validate and store the learner profile.
 *
 * Validation runs before the write, so a form that let a blank name through
 * can never reach storage. Resolves to the stored — trimmed — profile.
 */
export const makeSaveLearnerProfile = (deps: {
  profiles: LearnerProfileRepository;
}): SaveLearnerProfile => {
  return (input) =>
    parseProfile(input).asyncAndThen((profile) =>
      ResultAsync.fromPromise(deps.profiles.set(profile), toInternalError).map(() => profile),
    );
};
