import type { ContinueWatchingLocation } from "@/domain/entities/continue-watching-location/continue-watching-location";
import type { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import type { LearnerSnapshot } from "@/lib/learner-snapshot/learner-snapshot";
import { reportHandledError } from "@/lib/report-handled-error/report-handled-error";

import { createStore } from "zustand/vanilla";

/**
 * The signed-in learner's state as the browser holds it.
 *
 * @remarks
 * Collections are replaced, never mutated, so a reader can compare them by
 * identity: `useSyncExternalStore` re-renders only when a slice really
 * changed.
 *
 * @category Learner state
 */
export type LearnerState = {
  /** `false` until the server's snapshot has been adopted in this browser. */
  isSeeded: boolean;
  profile: LearnerProfile | null;
  completed: ReadonlySet<string>;
  positions: ReadonlyMap<string, number>;
  continueWatching: ContinueWatchingLocation | null;
  /** Lessons whose ticket was earned; kept even when the lesson is un-marked. */
  earnedTickets: ReadonlySet<string>;
  /** Modules whose prize was claimed on the counter. */
  claimedPrizes: ReadonlySet<string>;
};

const EMPTY_STATE: LearnerState = {
  isSeeded: false,
  profile: null,
  completed: new Set(),
  positions: new Map(),
  continueWatching: null,
  earnedTickets: new Set(),
  claimedPrizes: new Set(),
};

/**
 * The one client store of learner state, read by the composition-root hooks
 * and written by the learner-store adapters.
 *
 * @remarks
 * Module-level on purpose: every surface in the tab must agree. It is only
 * ever filled in the browser ({@link seedLearnerStore} refuses without a
 * `window`), so a server process never holds one learner's data while
 * rendering another's page.
 *
 * @category Learner state
 */
export const learnerStore = createStore<LearnerState>(() => EMPTY_STATE);

/**
 * Adopts the snapshot the server loaded for this request.
 *
 * @param snapshot - The learner's snapshot, from the locale layout
 *
 * @category Learner state
 */
export function seedLearnerStore(snapshot: LearnerSnapshot): void {
  if (typeof window === "undefined") return;
  learnerStore.setState(stateOf(snapshot), true);
}

/**
 * Empties the store, as for a signed-out visitor.
 *
 * @category Learner state
 */
export function resetLearnerStore(): void {
  learnerStore.setState(EMPTY_STATE, true);
}

/**
 * Applies a change at once, then keeps it only if the server accepts it.
 *
 * @remarks
 * The optimistic half of every learner write: readers see the change before
 * the request answers. When the request resolves `false` or throws, exactly
 * the slices `apply` touched are put back — anything else written meanwhile
 * is left alone.
 *
 * @param apply - Computes the slices to change from the current state
 * @param request - Sends the change; resolves whether the server accepted it
 * @returns Whether the change was kept
 *
 * @category Learner state
 */
export async function writeThrough(
  apply: (state: LearnerState) => Partial<LearnerState>,
  request: () => Promise<boolean>,
): Promise<boolean> {
  const current = learnerStore.getState();
  const change = apply(current);
  const previous = pick(current, Object.keys(change) as Array<keyof LearnerState>);
  learnerStore.setState(change);

  const accepted = await isAccepted(request, Object.keys(change).join(","));
  if (!accepted) learnerStore.setState(previous);
  return accepted;
}

// A rolled-back write is handled here, so nothing throws: report it or it
// would never be seen.
async function isAccepted(request: () => Promise<boolean>, slices: string): Promise<boolean> {
  try {
    const accepted = await request();
    if (!accepted)
      void reportHandledError(new Error("The server refused a learner write"), {
        where: "learner-store",
        slices,
      });
    return accepted;
  } catch (error) {
    void reportHandledError(error, { where: "learner-store", slices });
    return false;
  }
}

function stateOf(snapshot: LearnerSnapshot): LearnerState {
  return {
    isSeeded: true,
    profile: snapshot.profile,
    completed: new Set(snapshot.completedLessonIds),
    positions: new Map(Object.entries(snapshot.positions)),
    continueWatching: snapshot.continueWatching,
    earnedTickets: new Set(snapshot.earnedTicketLessonIds),
    claimedPrizes: new Set(snapshot.claimedPrizeModuleSlugs),
  };
}

function pick(state: LearnerState, keys: Array<keyof LearnerState>): Partial<LearnerState> {
  return Object.fromEntries(keys.map((key) => [key, state[key]]));
}
