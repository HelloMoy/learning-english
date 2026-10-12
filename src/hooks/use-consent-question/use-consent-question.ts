"use client";

import { consentStore } from "@/lib/product-analytics/product-analytics";

import { useSyncExternalStore } from "react";

/**
 * Where the consent question stands for the interface.
 *
 * - `unavailable` — product analytics never started; there is nothing to ask.
 * - `open` — the visitor has not answered yet, or asked to reconsider.
 * - `answered` — the visitor accepted or declined.
 *
 * @category Observability
 */
export type ConsentQuestion = "unavailable" | "open" | "answered";

function consentQuestion(): ConsentQuestion {
  const { status, isReconsidering } = consentStore.getState();
  if (status === "unavailable") return "unavailable";
  return status === "pending" || isReconsidering ? "open" : "answered";
}

const unavailableOnTheServer = (): ConsentQuestion => "unavailable";

/**
 * Client hook: whether the consent banner has a question to ask right now.
 *
 * @remarks
 * Always `unavailable` on the server and on the first client render: PostHog
 * starts after hydration, and only it knows what this browser answered
 * before. The banner therefore never appears in server HTML, and appears a
 * moment after load for a visitor who has not chosen.
 *
 * @example
 * ```tsx
 * const question = useConsentQuestion();
 * if (question !== "open") return null;
 * ```
 *
 * @returns The state of the question
 *
 * @category Observability
 */
export function useConsentQuestion(): ConsentQuestion {
  return useSyncExternalStore(consentStore.subscribe, consentQuestion, unavailableOnTheServer);
}
