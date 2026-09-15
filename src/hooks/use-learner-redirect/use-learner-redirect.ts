"use client";

import type { LearnerProfileState } from "@/hooks/use-learner-profile/use-learner-profile";
import { useRouter } from "@/i18n/navigation";

import { useEffect } from "react";

/** When a page sends the learner elsewhere, and where to. */
export type LearnerRedirectRule = {
  when: "absent" | "present";
  to: string;
};

/**
 * Sends the learner to another page once their profile status matches a rule.
 *
 * @remarks
 * The personal pages are guarded on the client, because only the browser knows
 * whether this device holds a profile. Nothing is decided while the status is
 * `unknown`, so no page flashes a redirect during hydration.
 *
 * `replace` rather than `push`: the guarded page was never somewhere the
 * learner meant to be, so Back should not return to it.
 *
 * @param status - The learner profile status to judge
 * @param rule - The status that triggers the redirect, and its target path
 *
 * @example
 * ```ts
 * const learner = useLearnerProfile();
 * useLearnerRedirect(learner.status, { when: "absent", to: "/start" });
 * ```
 */
export function useLearnerRedirect(
  status: LearnerProfileState["status"],
  rule: LearnerRedirectRule,
): void {
  const router = useRouter();
  const { when, to } = rule;
  const shouldRedirect = status === when;

  useEffect(() => {
    if (shouldRedirect) router.replace(to);
  }, [shouldRedirect, router, to]);
}
