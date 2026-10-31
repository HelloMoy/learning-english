import {
  attachProductAnalyticsClient,
  detachProductAnalyticsClient,
  type ProductAnalyticsClient,
} from "@/lib/product-analytics/product-analytics";

type ConsentAnswer = ReturnType<ProductAnalyticsClient["get_explicit_consent_status"]>;

/**
 * Starts product analytics for a story with a stand-in for PostHog that only
 * remembers the visitor's answer, and stops it again when the story unmounts.
 *
 * @remarks
 * Without this a story renders as a build with no PostHog token does: no
 * consent banner and no footer control. Nothing here reaches a network.
 *
 * @example
 * ```ts
 * export const Asking: Story = { beforeEach: withConsent("pending") };
 * ```
 *
 * @param answer - What the visitor had answered when the story opens
 * @returns A `beforeEach` for the story, returning its own cleanup
 */
export function withConsent(answer: ConsentAnswer) {
  return () => {
    attachProductAnalyticsClient(clientRemembering(answer));
    return detachProductAnalyticsClient;
  };
}

function clientRemembering(answer: ConsentAnswer): ProductAnalyticsClient {
  let consent = answer;
  return {
    capture: () => undefined,
    identify: () => undefined,
    reset: () => {
      consent = "pending";
    },
    opt_in_capturing: () => {
      consent = "granted";
    },
    opt_out_capturing: () => {
      consent = "denied";
    },
    get_explicit_consent_status: () => consent,
    get_property: () => undefined,
    startSessionRecording: () => undefined,
    stopSessionRecording: () => undefined,
  };
}
