import type { LearnerProfile } from "@/domain/entities/learner-profile/learner-profile";

import { expect, test as signedIn } from "./learner-account-fixture";
import type { LearnerState } from "./learner-state-fixture";

/**
 * Learner-card fixtures for specs that open course routes.
 *
 * Built on `learner-account-fixture`: every context is signed in first, since
 * course routes require a session before they require a card.
 *
 * @remarks
 * Course, module and lesson routes send a learner without a card to the
 * onboarding (capability: `learner-onboarding`). Specs that exercise the course
 * itself are not about the onboarding, so they run as a learner who has already
 * made their card.
 */

/** The learner every onboarded spec runs as. */
export const ONBOARDED_LEARNER: LearnerProfile = {
  name: "Ana García",
  avatar: { kind: "initials" },
};

/**
 * Saves {@link ONBOARDED_LEARNER} as the signed-in learner's card.
 *
 * @remarks
 * Call it before opening the page: the card arrives with the page's learner
 * snapshot, as it would for a learner who made it on another device.
 *
 * @param learnerState - The signed-in learner's rows
 */
export async function seedLearnerProfile(learnerState: LearnerState): Promise<void> {
  await learnerState.profile(ONBOARDED_LEARNER);
}

/** Playwright's `test`, with every context signed in and holding a learner card. */
export const test = signedIn.extend<{ onboardedLearner: void }>({
  onboardedLearner: [
    async ({ learnerState }, use) => {
      await seedLearnerProfile(learnerState);
      await use();
    },
    { auto: true },
  ],
});

export { expect };
