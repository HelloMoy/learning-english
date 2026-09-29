import type { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import type { ContinueWatchingRecord } from "@/domain/entities/continue-watching-record/continue-watching-record";
import type { ContinueWatchingRepository } from "@/domain/ports/continue-watching-repository/continue-watching-repository";
import { learnerStore, writeThrough, type LearnerState } from "@/lib/learner-store/learner-store";

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
 * The browser's `ContinueWatchingRepository`: the learner store's places, one
 * per course, saved through the continue-watching Server Action.
 *
 * @remarks
 * Optimistic like every learner write, and the port's "a failed write does not
 * break the page" holds: a refusal puts the previous places back and resolves
 * quietly. Recording a place also enrolls the learner in its course, as the
 * server does (capability `course-enrollment`), so both slices change — and
 * roll back — together.
 */
export class LearnerStoreContinueWatchingRepository implements ContinueWatchingRepository {
  constructor(private readonly requests: ContinueWatchingRequests) {}

  async get(): Promise<ContinueWatchingLocation | null> {
    return learnerStore.getState().continueWatching[0]?.location ?? null;
  }

  async list(): Promise<ReadonlyArray<ContinueWatchingRecord>> {
    return learnerStore.getState().continueWatching;
  }

  async set(location: ContinueWatchingLocation): Promise<void> {
    await writeThrough(
      (state) => withVisit(state, location),
      () => this.requests.record(location),
    );
  }
}

// The client's clock only orders places until the next snapshot replaces them
// with the times the database stored.
function withVisit(state: LearnerState, location: ContinueWatchingLocation): Partial<LearnerState> {
  const otherCourses = state.continueWatching.filter(
    (record) => record.location.courseSlug !== location.courseSlug,
  );
  return {
    continueWatching: [{ location, watchedAt: Date.now() }, ...otherCourses],
    enrolledCourses: new Set(state.enrolledCourses).add(location.courseSlug),
  };
}
