import type { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import type { LearnerProfileRepository } from "@/domain/ports/learner-profile-repository/learner-profile-repository";
import { learnerStore, writeThrough } from "@/lib/learner-store/learner-store";

/**
 * How a {@link LearnerStoreLearnerProfileRepository} saves a card; resolves
 * whether the server accepted it.
 *
 * @category Learner state
 */
export type ProfileRequests = {
  save: (profile: LearnerProfile) => Promise<boolean>;
};

/**
 * The browser's `LearnerProfileRepository`: the learner store's card, saved
 * through the profile Server Action.
 *
 * @remarks
 * The card changes everywhere at once — the header shows a new avatar before
 * the save answers — and a refused save puts the previous card back.
 */
export class LearnerStoreLearnerProfileRepository implements LearnerProfileRepository {
  constructor(private readonly requests: ProfileRequests) {}

  async get(): Promise<LearnerProfile | null> {
    return learnerStore.getState().profile;
  }

  async set(profile: LearnerProfile): Promise<void> {
    await writeThrough(
      () => ({ profile }),
      () => this.requests.save(profile),
    );
  }
}
