import { LEARNER_PROFILE_STORAGE_KEY } from "@/adapters/persistence/browser-local-storage/browser-local-storage-learner-profile-repository/browser-local-storage-learner-profile-repository";
import type { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";

import { test as base, expect, type BrowserContext } from "@playwright/test";

/**
 * Learner-card fixtures for specs that open course routes.
 *
 * @remarks
 * Course, module and lesson routes send a device without a learner profile to
 * the onboarding (capability: `learner-onboarding`). Specs that exercise the
 * course itself are not about the onboarding, so they run as a learner who has
 * already made their card.
 */

/** The learner every onboarded spec runs as. */
export const ONBOARDED_LEARNER: LearnerProfile = {
  name: "Ana García",
  avatar: { kind: "initials" },
};

/**
 * Stores {@link ONBOARDED_LEARNER} on every page load of this context.
 *
 * @remarks
 * Init scripts run in registration order, so a spec that clears storage from
 * its own init script must call this after that script to keep the card.
 *
 * @param context - The browser context to seed
 */
export async function seedLearnerProfile(context: BrowserContext): Promise<void> {
  await context.addInitScript(([key, value]) => window.localStorage.setItem(key, value), [
    LEARNER_PROFILE_STORAGE_KEY,
    JSON.stringify(ONBOARDED_LEARNER),
  ] as const);
}

/** Playwright's `test`, with every context already holding a learner card. */
export const test = base.extend<{ onboardedLearner: void }>({
  onboardedLearner: [
    async ({ context }, use) => {
      await seedLearnerProfile(context);
      await use();
    },
    { auto: true },
  ],
});

export { expect };
