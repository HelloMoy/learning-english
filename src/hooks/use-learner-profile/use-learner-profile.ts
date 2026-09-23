"use client";

import { LearnerStoreLearnerProfileRepository } from "@/adapters/persistence/learner-store/learner-store-learner-profile-repository/learner-store-learner-profile-repository";
import { saveLearnerProfileAction } from "@/app/[locale]/learner-actions";
import type { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import type { LearnerProfileRepository } from "@/domain/ports/learner-profile-repository/learner-profile-repository";
import { makeFindLearnerProfile } from "@/domain/use-cases/find-learner-profile/find-learner-profile";
import { makeSaveLearnerProfile } from "@/domain/use-cases/save-learner-profile/save-learner-profile";
import { learnerStore, type LearnerState } from "@/lib/learner-store/learner-store";

import { useMemo, useSyncExternalStore } from "react";

/**
 * What the client knows about the learner on this device.
 *
 * - `unknown` — the learner's state is not known yet: the server render, the hydration
 *   pass, and the moment before the first read answers.
 * - `absent` — the learner has no card.
 * - `present` — the learner's card.
 *
 * @category Utilities
 */
export type LearnerProfileState =
  { status: "unknown" } | { status: "absent" } | { status: "present"; profile: LearnerProfile };

/**
 * The profile state plus the one way to change it.
 *
 * `save` validates first and resolves to whether the profile was stored.
 */
export type LearnerProfileHandle = LearnerProfileState & {
  save: (input: unknown) => Promise<boolean>;
};

type ProfileStore = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => LearnerProfileState;
  save: (input: unknown) => Promise<boolean>;
};

const UNKNOWN: LearnerProfileState = { status: "unknown" };

const toState = (profile: LearnerProfile | null): LearnerProfileState =>
  profile ? { status: "present", profile } : { status: "absent" };

function createProfileStore(repository: LearnerProfileRepository): ProfileStore {
  const findProfile = makeFindLearnerProfile({ profiles: repository });
  const saveProfile = makeSaveLearnerProfile({ profiles: repository });
  const listeners = new Set<() => void>();
  let snapshot = UNKNOWN;

  const publish = (next: LearnerProfileState): void => {
    snapshot = next;
    for (const listener of listeners) listener();
  };
  const reload = async (): Promise<void> => {
    const result = await findProfile();
    publish(toState(result.unwrapOr(null)));
  };

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      if (listeners.size === 0) void reload();
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    save: async (input) => {
      const result = await saveProfile(input);
      if (result.isErr()) return false;
      publish({ status: "present", profile: result.value });
      return true;
    },
  };
}

/**
 * The signed-in learner's card, read from the learner store and saved through
 * the profile Server Action — the default every page uses.
 */
const learnerProfiles = new LearnerStoreLearnerProfileRepository({
  save: async (profile) => (await saveLearnerProfileAction(profile))?.data?.saved === true,
});

let lastLearnerState: LearnerState | undefined;
let lastProfileState: LearnerProfileState = UNKNOWN;

/**
 * The learner store, seen as a profile state. Memoized on the store's own
 * state object so `useSyncExternalStore` gets the same value until it changes.
 */
function learnerProfileState(): LearnerProfileState {
  const state = learnerStore.getState();
  if (state !== lastLearnerState) {
    lastLearnerState = state;
    const next = state.isSeeded ? toState(state.profile) : UNKNOWN;
    if (!sameProfileState(next, lastProfileState)) lastProfileState = next;
  }
  return lastProfileState;
}

function sameProfileState(a: LearnerProfileState, b: LearnerProfileState): boolean {
  if (a.status !== b.status) return false;
  return a.status !== "present" || (b.status === "present" && a.profile === b.profile);
}

const saveLearnerCard = makeSaveLearnerProfile({ profiles: learnerProfiles });

async function saveToLearnerStore(input: unknown): Promise<boolean> {
  const result = await saveLearnerCard(input);
  return result.isOk() && learnerStore.getState().profile === result.value;
}

const learnerProfileStore: ProfileStore = {
  subscribe: learnerStore.subscribe,
  getSnapshot: learnerProfileState,
  save: saveToLearnerStore,
};

const stores = new WeakMap<LearnerProfileRepository, ProfileStore>();

function storeFor(repository: LearnerProfileRepository | undefined): ProfileStore {
  if (!repository) return learnerProfileStore;
  let store = stores.get(repository);
  if (!store) {
    store = createProfileStore(repository);
    stores.set(repository, store);
  }
  return store;
}

/**
 * The snapshot the server renders with: always `unknown`.
 *
 * @remarks
 * The server renders no learner state, and the hydration pass must agree
 * with it, so no page may claim a learner is present or absent before the
 * client has looked. Exported so the contract is testable rather than implied.
 *
 * @returns The stable unknown state
 */
export function learnerProfileServerSnapshot(): LearnerProfileState {
  return UNKNOWN;
}

/**
 * Client hook: the signed-in learner's card, and a way to save it.
 *
 * @remarks
 * The client's composition root for the profile — the one place that names
 * the concrete adapter and composes the `findLearnerProfile` and
 * `saveLearnerProfile` use cases.
 *
 * Without an injected repository it reads the learner store, which the
 * server's snapshot seeds after hydration, and saves through the profile
 * Server Action; every reader shares that store, so a save made on the
 * Profile page reaches the header in the same render pass. A save made in
 * another tab or on another device arrives with the next full load.
 *
 * Browser-side only — do NOT call from a Server Component.
 *
 * @param repository - Overrides the learner store; tests inject a stub here
 * @returns The current state and `save`
 *
 * @example
 * ```tsx
 * const learner = useLearnerProfile();
 * if (learner.status === "present") return <LearnerAvatar profile={learner.profile} />;
 * ```
 */
export function useLearnerProfile(repository?: LearnerProfileRepository): LearnerProfileHandle {
  const store = storeFor(repository);
  const state = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    learnerProfileServerSnapshot,
  );
  return useMemo(() => ({ ...state, save: store.save }), [state, store]);
}
