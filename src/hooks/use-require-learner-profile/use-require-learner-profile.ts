"use client";

import type { LearnerProfileRepository } from "@/domain/ports/learner-profile-repository/learner-profile-repository";
import { useLearnerProfile } from "@/hooks/use-learner-profile/use-learner-profile";
import { useLearnerRedirect } from "@/hooks/use-learner-redirect/use-learner-redirect";
import { usePathname } from "@/i18n/navigation";
import { withReturnPath } from "@/lib/onboarding-return-path/onboarding-return-path";

const ONBOARDING_PATH = "/start";

/**
 * Sends a device without a learner profile from a course route to the
 * onboarding, remembering the route so the onboarding can return to it.
 *
 * @remarks
 * Course routes are rendered in full on the server, so crawlers and share
 * previews keep their content; the decision is made here, after hydration,
 * once storage has been read. Nothing happens while the profile is unknown,
 * and the redirect replaces the history entry — see {@link useLearnerRedirect}.
 *
 * @param profiles - Overrides the profile storage adapter; tests inject a stub
 *
 * @example
 * ```ts
 * useRequireLearnerProfile();
 * ```
 */
export function useRequireLearnerProfile(profiles?: LearnerProfileRepository): void {
  const learner = useLearnerProfile(profiles);
  const pathname = usePathname();

  useLearnerRedirect(learner.status, {
    when: "absent",
    to: withReturnPath(ONBOARDING_PATH, pathname),
  });
}
