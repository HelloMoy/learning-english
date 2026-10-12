"use client";

import { useConsentStatus } from "@/hooks/use-consent-status/use-consent-status";
import { forgetLearner, identifyLearner } from "@/lib/product-analytics/product-analytics";

import { useEffect } from "react";

/**
 * Client hook: keeps PostHog's identity in step with who is signed in.
 *
 * @remarks
 * Mounted once, in `GlobalProviders`, with the account ID the locale layout
 * read from the session. While a learner is signed in and has accepted, their
 * activity is attributed to that ID — and to nothing else about them. Once
 * nobody is signed in, an identity left over from a sign-out, an account
 * deletion or an expired session is ended, so the next person on the device
 * is not taken for the learner who left.
 *
 * Consent is a dependency on purpose: accepting while already signed in must
 * identify at that moment, not on the next page load.
 *
 * @example
 * ```tsx
 * useAnalyticsIdentity(learnerAccountId);
 * ```
 *
 * @param accountId - The signed-in learner's account ID, or `null` when signed out
 *
 * @category Observability
 */
export function useAnalyticsIdentity(accountId: string | null): void {
  const consent = useConsentStatus();

  useEffect(() => {
    if (accountId) identifyLearner(accountId);
    else forgetLearner();
  }, [accountId, consent]);
}
