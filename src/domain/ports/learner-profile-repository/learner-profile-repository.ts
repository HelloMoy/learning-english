import type { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";

/**
 * Port: the one learner profile this device holds.
 *
 * Like `ContinueWatchingRepository`, the store is a single slot — a device
 * has one learner — so `set` replaces whatever was there.
 *
 * `get` resolves to `null` when nothing has been saved, when the stored value
 * cannot be parsed, or when storage is unavailable. A device without a profile
 * is a supported state: it is simply a learner who has not onboarded yet.
 */
export interface LearnerProfileRepository {
  get(): Promise<LearnerProfile | null>;
  set(profile: LearnerProfile): Promise<void>;
}
