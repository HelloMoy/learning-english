import type { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import type { ContinueWatchingRepository } from "@/domain/ports/continue-watching-repository/continue-watching-repository";
import { learnerStore, writeThrough } from "@/lib/learner-store/learner-store";

/**
 * How a {@link LearnerStoreContinueWatchingRepository} saves a location;
 * resolves whether the server accepted it.
 *
 * @category Learner state
 */
export type ContinueWatchingRequests = {
  record: (location: ContinueWatchingLocation) => Promise<boolean>;
};

/**
 * The browser's `ContinueWatchingRepository`: the learner store's one
 * location, saved through the continue-watching Server Action.
 *
 * @remarks
 * Optimistic like every learner write, and the port's "a failed write does not
 * break the page" holds: a refusal puts the previous location back and
 * resolves quietly.
 */
export class LearnerStoreContinueWatchingRepository implements ContinueWatchingRepository {
  constructor(private readonly requests: ContinueWatchingRequests) {}

  async get(): Promise<ContinueWatchingLocation | null> {
    return learnerStore.getState().continueWatching;
  }

  async set(location: ContinueWatchingLocation): Promise<void> {
    await writeThrough(
      () => ({ continueWatching: location }),
      () => this.requests.record(location),
    );
  }
}
