"use client";

import {
  BrowserLocalStorageLearnerProfileRepository,
  LEARNER_PROFILE_STORAGE_KEY,
} from "@/adapters/persistence/browser-local-storage/browser-local-storage-learner-profile-repository/browser-local-storage-learner-profile-repository";
import type { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";
import type { LearnerProfileRepository } from "@/domain/ports/learner-profile-repository/learner-profile-repository";
import { makeFindLearnerProfile } from "@/domain/use-cases/find-learner-profile/find-learner-profile";
import { makeSaveLearnerProfile } from "@/domain/use-cases/save-learner-profile/save-learner-profile";

import { useMemo, useSyncExternalStore } from "react";

/**
 * What the client knows about the learner on this device.
 *
 * - `unknown` — storage has not been read: the server render, the hydration
 *   pass, and the moment before the first read answers.
 * - `absent` — storage answered and holds no usable profile.
 * - `present` — storage holds this profile.
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
  // `key` is null when another tab cleared all of storage.
  const onStorage = (event: StorageEvent): void => {
    if (event.key === null || event.key === LEARNER_PROFILE_STORAGE_KEY) void reload();
  };

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      if (listeners.size === 0) {
        window.addEventListener("storage", onStorage);
        void reload();
      }
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) window.removeEventListener("storage", onStorage);
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

const stores = new WeakMap<LearnerProfileRepository, ProfileStore>();
let browserRepository: LearnerProfileRepository | undefined;

function storeFor(repository: LearnerProfileRepository | undefined): ProfileStore {
  browserRepository ??= new BrowserLocalStorageLearnerProfileRepository();
  const key = repository ?? browserRepository;
  let store = stores.get(key);
  if (!store) {
    store = createProfileStore(key);
    stores.set(key, store);
  }
  return store;
}

/**
 * The snapshot the server renders with: always `unknown`.
 *
 * @remarks
 * The server cannot read `localStorage`, and the hydration pass must agree
 * with it, so no page may claim a learner is present or absent before the
 * client has looked. Exported so the contract is testable rather than implied.
 *
 * @returns The stable unknown state
 */
export function learnerProfileServerSnapshot(): LearnerProfileState {
  return UNKNOWN;
}

/**
 * Client hook: the learner profile on this device, and a way to save it.
 *
 * @remarks
 * The client's composition root for the profile — the one place that names
 * the concrete adapter and composes the `findLearnerProfile` and
 * `saveLearnerProfile` use cases.
 *
 * Every reader of the same repository shares one store, so a save made on
 * the Profile page reaches the header in the same render pass. A save made
 * in another tab arrives through the `storage` event.
 *
 * Browser-side only — do NOT call from a Server Component.
 *
 * @param repository - Overrides the storage adapter; tests inject a stub here
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
