import type { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import type { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import { learnerStore } from "@/lib/learner-store/learner-store";

/**
 * Seeds one slice of the learner store for a test, as if the server's
 * snapshot had carried it, leaving the other slices as they are.
 *
 * @remarks
 * Also used by story fixtures, so it does not depend on Testing Library: a
 * test that seeds while components are mounted wraps the call in `act`. The
 * store is reset after every test by the global cleanup.
 */
export const givenLearner = {
  completed(lessonIds: ReadonlyArray<string>): void {
    update((state) => ({ completed: new Set([...state.completed, ...lessonIds]) }));
  },
  notCompleted(lessonIds: ReadonlyArray<string>): void {
    update((state) => ({
      completed: new Set([...state.completed].filter((id) => !lessonIds.includes(id))),
    }));
  },
  positions(positions: Readonly<Record<string, number>>): void {
    update((state) => ({ positions: new Map([...state.positions, ...Object.entries(positions)]) }));
  },
  withoutPositions(lessonIds: ReadonlyArray<string>): void {
    update((state) => ({
      positions: new Map([...state.positions].filter(([id]) => !lessonIds.includes(id))),
    }));
  },
  earnedTickets(lessonIds: ReadonlyArray<string>): void {
    update((state) => ({ earnedTickets: new Set([...state.earnedTickets, ...lessonIds]) }));
  },
  claimedPrizes(moduleSlugs: ReadonlyArray<string>): void {
    update((state) => ({ claimedPrizes: new Set([...state.claimedPrizes, ...moduleSlugs]) }));
  },
  withoutEarnedTickets(lessonIds: ReadonlyArray<string>): void {
    update((state) => ({
      earnedTickets: new Set([...state.earnedTickets].filter((id) => !lessonIds.includes(id))),
    }));
  },
  withoutClaimedPrizes(moduleSlugs: ReadonlyArray<string>): void {
    update((state) => ({
      claimedPrizes: new Set(
        [...state.claimedPrizes].filter((slug) => !moduleSlugs.includes(slug)),
      ),
    }));
  },
  profile(profile: LearnerProfile | null): void {
    update(() => ({ profile }));
  },
  continueWatching(location: ContinueWatchingLocation | null): void {
    update(() => ({ continueWatching: location }));
  },
};

function update(
  change: (
    state: ReturnType<typeof learnerStore.getState>,
  ) => Partial<ReturnType<typeof learnerStore.getState>>,
): void {
  learnerStore.setState((state) => ({ ...change(state), isSeeded: true }));
}
