import {
  attachProductAnalyticsClient,
  type ProductAnalyticsClient,
} from "@/lib/product-analytics/product-analytics";

import { vi } from "vitest";

type ExplicitConsent = ReturnType<ProductAnalyticsClient["get_explicit_consent_status"]>;

/**
 * A stand-in for the PostHog client that keeps the behaviour the application
 * depends on: consent is state, opting in or out changes it, `reset()` clears
 * it along with the identity — as the SDK's own `reset` does — and the client
 * remembers whether anyone is identified.
 */
export function fakeProductAnalyticsClient(initialConsent: ExplicitConsent = "pending") {
  let consent = initialConsent;
  let userState: "anonymous" | "identified" = "anonymous";
  return {
    capture: vi.fn(),
    identify: vi.fn(() => {
      userState = "identified";
    }),
    reset: vi.fn(() => {
      consent = "pending";
      userState = "anonymous";
    }),
    opt_in_capturing: vi.fn(() => {
      consent = "granted";
    }),
    opt_out_capturing: vi.fn(() => {
      consent = "denied";
    }),
    get_explicit_consent_status: () => consent,
    get_property: (name: string) => (name === "$user_state" ? userState : undefined),
    startSessionRecording: vi.fn(),
    stopSessionRecording: vi.fn(),
  } satisfies ProductAnalyticsClient;
}

/**
 * Starts product analytics for a test, as `instrumentation-client` does when a
 * project token is configured. The global cleanup detaches it after each test.
 *
 * @param initialConsent - What the visitor had already answered, if anything
 * @returns The fake client, for asserting on what reached PostHog
 */
export function givenProductAnalytics(initialConsent: ExplicitConsent = "pending") {
  const client = fakeProductAnalyticsClient(initialConsent);
  attachProductAnalyticsClient(client);
  return client;
}
