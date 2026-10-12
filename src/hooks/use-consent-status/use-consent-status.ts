"use client";

import {
  consentStatus,
  consentStore,
  type ConsentStatus,
} from "@/lib/product-analytics/product-analytics";

import { useSyncExternalStore } from "react";

const unavailableOnTheServer = (): ConsentStatus => "unavailable";

/**
 * Client hook: the visitor's answer to the consent question, re-rendering
 * when it changes.
 *
 * @remarks
 * For effects that must run the moment consent is given or withdrawn —
 * identifying the learner, starting or stopping a recording. A component that
 * only needs to know whether to show the banner uses `useConsentQuestion`.
 *
 * Always `unavailable` on the server and on the first client render.
 *
 * @example
 * ```ts
 * const consent = useConsentStatus();
 * useEffect(() => {
 *   if (consent === "granted") startRecording();
 * }, [consent]);
 * ```
 *
 * @returns The current status
 *
 * @category Observability
 */
export function useConsentStatus(): ConsentStatus {
  return useSyncExternalStore(consentStore.subscribe, consentStatus, unavailableOnTheServer);
}
